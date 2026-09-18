#!/usr/bin/env bash
# Style test for the Heba Zituni montage.
# Swap the synthetic sources in make_source() for real footage and the rest stands.
set -euo pipefail

W=${W:-3840}; H=${H:-2160}; FPS=${FPS:-30}
OUT=${OUT:-montage-4k.mp4}
DIR="$(cd "$(dirname "$0")" && pwd)"; cd "$DIR"
S=$(python3 -c "print($W/3840)")          # scale text with resolution
px() { python3 -c "print(max(1,int($1*$S)))"; }   # never floor a hairline to 0

SERIF=/usr/share/fonts/opentype/ebgaramond/EBGaramond12-Regular.otf
SERIF_I=/usr/share/fonts/opentype/ebgaramond/EBGaramond12-Italic.otf
SANS=/usr/share/fonts/opentype/montserrat/Montserrat-Regular.otf

BLACK=0x11120D; BONE=0xD8CFBC; WHITE=0xFFFBF4; BONEMID=0xC4BAA5

CLIP_D=4.5; XF=0.8; TITLE_D=4.0; END_D=3.5

# Letter-spaced small caps, the way the site sets its eyebrows.
space() { echo "$1" | sed 's/./& /g; s/ $//'; }

# --- stand-in footage -------------------------------------------------------
# Real shots replace this: ffmpeg -ss <in> -t $CLIP_D -i <shot.mov>
make_source() {
  local idx=$1 out=$2 c0=$3 c1=$4
  ffmpeg -y -v error \
    -f lavfi -i "gradients=s=${W}x${H}:c0=${c0}:c1=${c1}:x0=$((W/4)):y0=$((H/5)):x1=$((W*3/4)):y1=$((H*4/5)):speed=0.012:d=$CLIP_D:r=$FPS" \
    -vf "gblur=sigma=$(px 40),noise=alls=6:allf=t,vignette=PI/4.2,format=yuv420p" \
    -t $CLIP_D "$out"
}

# --- one clip: slow push + lower-third caption ------------------------------
build_clip() {
  local src=$1 out=$2 eyebrow=$3 line1=$4 line2=$5
  local EB; EB=$(space "$eyebrow")
  local frames; frames=$(python3 -c "print(int($CLIP_D*$FPS))")
  # Ken Burns: a slow 8% push, held centred.
  local kb="zoompan=z='min(zoom+0.00035,1.08)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}"
  # Caption rises 24px over 0.9s and fades with the cut.
  local rise="-$(px 24)*(1-min(1,max(0,(t-0.35))/0.9))"
  local a_in="min(1,max(0,(t-0.35)/0.7))"
  local a_out="min(1,max(0,($CLIP_D-0.5-t)/0.5))"
  cat > "g_${out%.mp4}.txt" <<GRAPH
    [0:v]${kb},
    drawbox=x=0:y=ih-$(px 560):w=iw:h=$(px 560):color=${BLACK}@0.55:t=fill,
    drawtext=fontfile=${SANS}:text='${EB}':fontcolor=${BONEMID}:fontsize=$(px 34):
      x=$(px 200):y='h-$(px 400)+${rise}':alpha='${a_in}*${a_out}',
    drawtext=fontfile=${SERIF}:text='${line1}':fontcolor=${BONE}:fontsize=$(px 104):
      x=$(px 200):y='h-$(px 330)+${rise}':alpha='min(1,max(0,(t-0.5)/0.7))*${a_out}',
    drawtext=fontfile=${SERIF_I}:text='${line2}':fontcolor=${WHITE}:fontsize=$(px 104):
      x=$(px 200):y='h-$(px 210)+${rise}':alpha='min(1,max(0,(t-0.65)/0.7))*${a_out}',
    format=yuv420p[v]
GRAPH
  ffmpeg -y -v error -i "$src" -filter_complex_script "g_${out%.mp4}.txt" -map "[v]" -r $FPS -t $CLIP_D "$out"
}

# --- title card -------------------------------------------------------------
build_title() {
  local out=$1
  local EB; EB=$(space "CREATIVE DIRECTOR   PHOTOGRAPHER   MUSCAT")
  # Hairline rule draws itself out from the left.
  cat > g_title.txt <<GRAPH
    [0:v]drawtext=fontfile=${SANS}:text='${EB}':fontcolor=${BONEMID}:fontsize=$(px 32):
      x=(w-text_w)/2:y='h/2-$(px 260)+$(px 18)*(1-min(1,t/1.1))':alpha='min(1,max(0,(t-0.2)/1.0))',
    drawtext=fontfile=${SERIF}:text='Heba':fontcolor=${WHITE}:fontsize=$(px 300):
      x=(w-text_w)/2:y='h/2-$(px 180)+$(px 26)*(1-min(1,max(0,(t-0.45))/1.2))':
      alpha='min(1,max(0,(t-0.45)/1.1))',
    drawtext=fontfile=${SERIF_I}:text='Zituni':fontcolor=${BONE}:fontsize=$(px 300):
      x=(w-text_w)/2:y='h/2+$(px 130)+$(px 26)*(1-min(1,max(0,(t-0.7))/1.2))':
      alpha='min(1,max(0,(t-0.7)/1.1))',
    drawbox=x='(iw-$(px 520))/2':y='ih/2+$(px 470)':w='$(px 520)*min(1,max(0,(t-1.5)/1.1))':h=$(px 2):
      color=${BONE}@0.75:t=fill,
    fade=t=out:st=$(python3 -c "print($TITLE_D-0.6)"):d=0.6:color=0x11120D,
    format=yuv420p[v]
GRAPH
  ffmpeg -y -v error -f lavfi -i "color=c=${BLACK}:s=${W}x${H}:r=${FPS}:d=${TITLE_D}" \
    -filter_complex_script g_title.txt -map "[v]" -t $TITLE_D "$out"
}

# --- end card ---------------------------------------------------------------
build_end() {
  local out=$1
  local EB; EB=$(space "GET IN TOUCH")   # no apostrophe: it would close drawtext's quote
  cat > g_end.txt <<GRAPH
    [0:v]drawtext=fontfile=${SANS}:text='${EB}':fontcolor=${BONEMID}:fontsize=$(px 32):
      x=(w-text_w)/2:y=h/2-$(px 150):alpha='min(1,max(0,(t-0.3)/1.0))',
    drawtext=fontfile=${SERIF}:text='hebazituni.com':fontcolor=${WHITE}:fontsize=$(px 150):
      x=(w-text_w)/2:y='h/2-$(px 60)+$(px 20)*(1-min(1,max(0,(t-0.55))/1.2))':
      alpha='min(1,max(0,(t-0.55)/1.1))',
    fade=t=out:st=$(python3 -c "print($END_D-0.9)"):d=0.9:color=0x11120D,
    format=yuv420p[v]
GRAPH
  ffmpeg -y -v error -f lavfi -i "color=c=${BLACK}:s=${W}x${H}:r=${FPS}:d=${END_D}" \
    -filter_complex_script g_end.txt -map "[v]" -t $END_D "$out"
}

echo "[1/4] stand-in footage @ ${W}x${H}"
make_source 1 s1.mp4 "0x2b2a24" "0x6b6757"
make_source 2 s2.mp4 "0x1a1a14" "0x565449"
make_source 3 s3.mp4 "0x3a3830" "0xC4BAA5"
make_source 4 s4.mp4 "0x11120D" "0x8a8574"

echo "[2/4] cards + captioned clips"
build_title t0.mp4
build_clip s1.mp4 c1.mp4 "PRODUCT"         "Bottles, light,"   "and the slow pour"
build_clip s2.mp4 c2.mp4 "PORTRAIT"        "The frame"         "before the smile"
build_clip s3.mp4 c3.mp4 "BRAND STORY"     "A world built"     "around one idea"
build_clip s4.mp4 c4.mp4 "BEHIND THE LENS" "How a brief"       "becomes a world"
build_end e0.mp4

echo "[3/4] crossfading the sequence"
# Chain xfades, tracking the running offset as each transition eats $XF seconds.
ffmpeg -y -v error -i t0.mp4 -i c1.mp4 -i c2.mp4 -i c3.mp4 -i c4.mp4 -i e0.mp4 \
  -filter_complex "$(python3 - <<PY
d=[$TITLE_D,$CLIP_D,$CLIP_D,$CLIP_D,$CLIP_D,$END_D]; xf=$XF
parts=[]; off=d[0]-xf; prev="0:v"
for i in range(1,6):
    lbl="x%d"%i
    parts.append("[%s][%d:v]xfade=transition=fade:duration=%s:offset=%.3f[%s]"%(prev,i,xf,off,lbl))
    prev=lbl; off += d[i]-xf
# Final grade: a touch of grain so the cards and footage share a surface.
parts.append("[%s]noise=alls=3:allf=t,format=yuv420p[v]"%prev)
print(";".join(parts))
PY
)" -map "[v]" -r $FPS -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart "$OUT"

echo "[4/4] done -> $OUT"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames \
  -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
