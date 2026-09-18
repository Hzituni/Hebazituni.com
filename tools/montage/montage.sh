#!/usr/bin/env bash
# Heba Zituni — montage builder (production).
#
#   ./montage.sh clips.tsv [output.mp4]
#
# clips.tsv is one clip per line, TAB-separated:
#   <file>  <in-point>  <duration>  <EYEBROW>  <title line 1>  <title line 2>
# e.g.
#   shots/pour.mov   00:00:12.5   4.5   PRODUCT   Bottles, light,   and the slow pour
#
# Runs anywhere ffmpeg 6+ with libx264 is installed. Override with env vars:
#   W/H (default 3840x2160)  FPS (30)  CRF (18)  XF (crossfade secs, 0.8)
#   SERIF / SERIF_I / SANS   (font file paths)
#   MUSIC=track.wav          (optional bed; ducked and faded)
set -euo pipefail

MANIFEST=${1:?usage: montage.sh clips.tsv [out.mp4]}
OUT=${2:-montage-4k.mp4}
W=${W:-3840}; H=${H:-2160}; FPS=${FPS:-30}; CRF=${CRF:-18}; XF=${XF:-0.8}
TITLE_D=${TITLE_D:-4.0}; END_D=${END_D:-3.5}
MUSIC=${MUSIC:-}
NAME1=${NAME1:-Heba}; NAME2=${NAME2:-Zituni}
EYEBROW=${EYEBROW:-"CREATIVE DIRECTOR   PHOTOGRAPHER   MUSCAT"}
ENDLINE=${ENDLINE:-hebazituni.com}

SERIF=${SERIF:-/usr/share/fonts/opentype/ebgaramond/EBGaramond12-Regular.otf}
SERIF_I=${SERIF_I:-/usr/share/fonts/opentype/ebgaramond/EBGaramond12-Italic.otf}
SANS=${SANS:-/usr/share/fonts/opentype/montserrat/Montserrat-Regular.otf}
for f in "$SERIF" "$SERIF_I" "$SANS"; do
  [ -r "$f" ] || { echo "missing font: $f" >&2; exit 1; }
done

BLACK=0x11120D; BONE=0xD8CFBC; WHITE=0xFFFBF4; BONEMID=0xC4BAA5
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
S=$(python3 -c "print($W/3840)")
px() { python3 -c "print(max(1,int($1*$S)))"; }
# Letter-spaced caps, matching the site's eyebrow styling.
space() { echo "$1" | sed 's/./& /g; s/ $//'; }
# An apostrophe would close drawtext's quoted text; strip it.
clean() { echo "$1" | tr -d "'"; }

n=0; durs=()
while IFS=$'\t' read -r file tin dur eyebrow l1 l2; do
  [ -z "${file:-}" ] && continue
  case "$file" in \#*) continue;; esac
  [ -r "$file" ] || { echo "missing clip: $file" >&2; exit 1; }
  n=$((n+1)); durs+=("$dur")
  frames=$(python3 -c "print(int($dur*$FPS))")
  EB=$(space "$(clean "$eyebrow")"); L1=$(clean "$l1"); L2=$(clean "$l2")
  rise="-$(px 24)*(1-min(1,max(0,(t-0.35))/0.9))"
  a_in="min(1,max(0,(t-0.35)/0.7))"; a_out="min(1,max(0,($dur-0.5-t)/0.5))"

  cat > "$WORK/g$n.txt" <<GRAPH
[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,
zoompan=z='min(zoom+0.00035,1.08)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS},
drawbox=x=0:y=ih-$(px 560):w=iw:h=$(px 560):color=${BLACK}@0.55:t=fill,
drawtext=fontfile=${SANS}:text='${EB}':fontcolor=${BONEMID}:fontsize=$(px 34):x=$(px 200):y='h-$(px 400)+${rise}':alpha='${a_in}*${a_out}',
drawtext=fontfile=${SERIF}:text='${L1}':fontcolor=${BONE}:fontsize=$(px 104):x=$(px 200):y='h-$(px 330)+${rise}':alpha='min(1,max(0,(t-0.5)/0.7))*${a_out}',
drawtext=fontfile=${SERIF_I}:text='${L2}':fontcolor=${WHITE}:fontsize=$(px 104):x=$(px 200):y='h-$(px 210)+${rise}':alpha='min(1,max(0,(t-0.65)/0.7))*${a_out}',
format=yuv420p[v]
GRAPH
  echo "  clip $n: $file @ $tin (${dur}s)"
  ffmpeg -nostdin -y -v error -ss "$tin" -t "$dur" -i "$file" \
    -filter_complex_script "$WORK/g$n.txt" -map "[v]" -r "$FPS" -t "$dur" "$WORK/c$n.mp4"
done < "$MANIFEST"
[ "$n" -gt 0 ] || { echo "no clips in $MANIFEST" >&2; exit 1; }

echo "  title card"
EBT=$(space "$(clean "$EYEBROW")")
cat > "$WORK/gt.txt" <<GRAPH
[0:v]drawtext=fontfile=${SANS}:text='${EBT}':fontcolor=${BONEMID}:fontsize=$(px 32):x=(w-text_w)/2:y='h/2-$(px 260)+$(px 18)*(1-min(1,t/1.1))':alpha='min(1,max(0,(t-0.2)/1.0))',
drawtext=fontfile=${SERIF}:text='$(clean "$NAME1")':fontcolor=${WHITE}:fontsize=$(px 300):x=(w-text_w)/2:y='h/2-$(px 180)+$(px 26)*(1-min(1,max(0,(t-0.45))/1.2))':alpha='min(1,max(0,(t-0.45)/1.1))',
drawtext=fontfile=${SERIF_I}:text='$(clean "$NAME2")':fontcolor=${BONE}:fontsize=$(px 300):x=(w-text_w)/2:y='h/2+$(px 130)+$(px 26)*(1-min(1,max(0,(t-0.7))/1.2))':alpha='min(1,max(0,(t-0.7)/1.1))',
drawbox=x='(iw-$(px 520))/2':y='ih/2+$(px 470)':w='$(px 520)*min(1,max(0,(t-1.5)/1.1))':h=$(px 2):color=${BONE}@0.75:t=fill,
fade=t=out:st=$(python3 -c "print(round($TITLE_D-0.6,3))"):d=0.6:color=${BLACK},
format=yuv420p[v]
GRAPH
ffmpeg -nostdin -y -v error -f lavfi -i "color=c=${BLACK}:s=${W}x${H}:r=${FPS}:d=${TITLE_D}" \
  -filter_complex_script "$WORK/gt.txt" -map "[v]" -t "$TITLE_D" "$WORK/t0.mp4"

echo "  end card"
EBE=$(space "GET IN TOUCH")
cat > "$WORK/ge.txt" <<GRAPH
[0:v]drawtext=fontfile=${SANS}:text='${EBE}':fontcolor=${BONEMID}:fontsize=$(px 32):x=(w-text_w)/2:y='h/2-$(px 150)':alpha='min(1,max(0,(t-0.3)/1.0))',
drawtext=fontfile=${SERIF}:text='$(clean "$ENDLINE")':fontcolor=${WHITE}:fontsize=$(px 150):x=(w-text_w)/2:y='h/2-$(px 60)+$(px 20)*(1-min(1,max(0,(t-0.55))/1.2))':alpha='min(1,max(0,(t-0.55)/1.1))',
fade=t=out:st=$(python3 -c "print(round($END_D-0.9,3))"):d=0.9:color=${BLACK},
format=yuv420p[v]
GRAPH
ffmpeg -nostdin -y -v error -f lavfi -i "color=c=${BLACK}:s=${W}x${H}:r=${FPS}:d=${END_D}" \
  -filter_complex_script "$WORK/ge.txt" -map "[v]" -t "$END_D" "$WORK/e0.mp4"

echo "  crossfading $((n+2)) segments"
INS=(-i "$WORK/t0.mp4"); for i in $(seq 1 $n); do INS+=(-i "$WORK/c$i.mp4"); done
INS+=(-i "$WORK/e0.mp4")
GRAPH=$(python3 - "$TITLE_D" "$END_D" "$XF" "${durs[@]}" <<'PY'
import sys
title,end,xf = float(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3])
d=[title]+[float(x) for x in sys.argv[4:]]+[end]
parts=[]; off=d[0]-xf; prev="0:v"
for i in range(1,len(d)):
    lbl="x%d"%i
    parts.append("[%s][%d:v]xfade=transition=fade:duration=%s:offset=%.3f[%s]"%(prev,i,xf,off,lbl))
    prev=lbl; off += d[i]-xf
parts.append("[%s]noise=alls=3:allf=t,format=yuv420p[v]"%prev)
print(";".join(parts))
PY
)
# Total = every segment, less the overlap each of the n+1 crossfades eats.
CLIPSUM=$(IFS=+; echo "${durs[*]}")
TOTAL=$(python3 -c "print(round($TITLE_D+$END_D+$CLIPSUM-$XF*$((n+1)),3))")

if [ -n "$MUSIC" ]; then
  echo "  mixing music bed"
  ffmpeg -nostdin -y -v error "${INS[@]}" -i "$MUSIC" \
    -filter_complex "${GRAPH};[$((n+2)):a]afade=t=in:st=0:d=1.5,afade=t=out:st=$(python3 -c "print(round($TOTAL-2.0,3))"):d=2.0,volume=0.85[a]" \
    -map "[v]" -map "[a]" -r "$FPS" -t "$TOTAL" \
    -c:v libx264 -preset medium -crf "$CRF" -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart "$OUT"
else
  ffmpeg -nostdin -y -v error "${INS[@]}" -filter_complex "${GRAPH}" -map "[v]" -r "$FPS" -t "$TOTAL" \
    -c:v libx264 -preset medium -crf "$CRF" -pix_fmt yuv420p -movflags +faststart "$OUT"
fi

echo "done -> $OUT"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
