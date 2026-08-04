from pathlib import Path
import runpy

runpy.run_path(Path(__file__).with_name('canvas-ux-smoke-5-7.py'), run_name='__main__')
