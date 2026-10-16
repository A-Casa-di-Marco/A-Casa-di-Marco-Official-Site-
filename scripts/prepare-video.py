"""Prepare website media. Originals are read-only; requires FFmpeg and Pillow."""
import argparse
import concurrent.futures
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', required=True)
parser.add_argument('--source', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'assets' / 'video'
out.mkdir(parents=True, exist_ok=True)

def run(arguments):
    subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', *arguments], check=True)

def prepare(orientation, filename, cuts, size):
    source = str(Path(args.source) / filename)
    scale = f'scale={size}:flags=lanczos,setsar=1,fps=24'
    pieces = []
    for index, start in enumerate(cuts):
        piece = root / '.preview' / f'{orientation}-{index}.mp4'
        run(['-threads', '2', '-ss', str(start), '-i', source, '-t', '6', '-an', '-vf',
             scale + ',fade=t=in:st=0:d=0.25,fade=t=out:st=5.75:d=0.25',
             '-c:v', 'libx264', '-threads', '2', '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', str(piece)])
        pieces.append(piece)
    manifest = root / '.preview' / f'{orientation}-concat.txt'
    manifest.write_text(''.join(f"file '{p.as_posix()}'\n" for p in pieces), encoding='utf-8')
    joined = root / '.preview' / f'hero-{orientation}-joined.mp4'
    run(['-f', 'concat', '-safe', '0', '-i', str(manifest), '-c', 'copy', str(joined)])
    hero_width = '1280' if orientation == 'desktop' else '540'
    run(['-i', str(joined), '-vf', f'scale={hero_width}:-2', '-c:v', 'libx264', '-threads', '2',
         '-preset', 'fast', '-crf', '28', '-an', '-movflags', '+faststart', str(out / f'hero-{orientation}.mp4')])
    run(['-threads', '2', '-ss', str(cuts[0] + 2), '-i', source, '-frames:v', '1', '-vf', f'scale={size}', str(out / f'poster-{orientation}.jpg')])
    run(['-threads', '2', '-i', source, '-an', '-vf', scale, '-c:v', 'libx264', '-threads', '2', '-preset', 'fast', '-crf', '25',
         '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / f'tour-{orientation}.mp4')])
    print(f'{orientation}: hero, poster and full tour ready', flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    jobs = [pool.submit(prepare, 'desktop', 'Tour casa orizzont.mp4', [9, 37, 68, 78], '1440:-2'),
            pool.submit(prepare, 'mobile', 'Tour casa.mp4', [9, 37, 64, 74], '720:-2')]
    for job in jobs:
        job.result()
