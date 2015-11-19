from __future__ import print_function

import datetime
import os
import shlex
import subprocess
import sys
import threading

try:
    from queue import Queue
except ImportError:
    from Queue import Queue

try:
    TIMESTAMP = datetime.datetime.now().timestamp()
except AttributeError:
    import time
    TIMESTAMP = time.time()
TEMP_DIR = "rotoscope_tmp{0}".format(TIMESTAMP)
FILM_NAME = sys.argv[1]

files_q = Queue()


def create_jpegs():
    command = "mplayer {film} -nosound -vo jpeg:outdir=./{tmp_dir}".format(
        film=FILM_NAME,
        tmp_dir=TEMP_DIR)
    subprocess.call(shlex.split(command))


def trace_file(jpeg_file):
    svg_filename = "{file_name}.svg".format(file_name=jpeg_file[:-4])
    trace_command = (
        "autotrace {input} "
        "-output-format svg "
        "-color-count 6 "
        "-despeckle-level 18 "
        "-despeckle-tightness 0.5 "
        "-filter-iterations 100 "
        "-output-file {output}".format(
            input=jpeg_file,
            output=svg_filename))
    subprocess.call(shlex.split(trace_command))
    subprocess.call(shlex.split("rm {0}".format(jpeg_file)))
    convert_command = "convert {svg_file} {jpg_file}".format(
        svg_file=svg_filename,
        jpg_file=jpeg_file)
    subprocess.call(shlex.split(convert_command))
    subprocess.call(shlex.split("rm {0}".format(svg_filename)))


def trace_thread(q):
    while True:
        work_file = q.get()
        print("FRAMES REMAINING: ", q.qsize())
        trace_file(work_file)
        q.task_done()


def autotrace_jpegs():
    os.chdir(TEMP_DIR)
    [files_q.put(os.path.join(os.getcwd(), f)) for f in os.listdir('.') if f[-3:] == 'jpg']
    print("QUEUE SIZE IS ", files_q.qsize())

    for x in range(8):
        t = threading.Thread(target=trace_thread, args=(files_q,))
        t.daemon = True
        t.start()


def create_new_video():
    cmd = "mencoder 'mf://*jpg' -ovc lavc -o {0}.rotoscoped.avi".format(
        FILM_NAME)
    subprocess.call(shlex.split(cmd))

if __name__ == '__main__':
    create_jpegs()
    autotrace_jpegs()
    files_q.join()
    create_new_video()
