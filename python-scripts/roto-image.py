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
FILE_NAME = sys.argv[1]

files_q = Queue()


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


if __name__ == '__main__':
    trace_file(FILE_NAME)
