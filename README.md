
Usage:

Demo: <a href="http://alexsmith540.github.io/ocuLeap/">http://alexsmith540.github.io/ocuLeap/</a>

Use leap to fly. The bigger you open your hand, the faster you go / vice versa. Draw a circle to rotate the camera. Press 'r' to reset your relative home point.

If you have an Oculus Rift (and the <a href="https://github.com/benvanik/vr.js/tree/master">vr.js plugin at github</a>), plug it in... I usually hold the oculus in 1 hand in front of me and pilot it with the other. You could do this much more elegant........

I recommend using headphones to get the most out of the 3d HTML5 audio experience...


Download / Build Instruction:
Dont forget to
```bower install```
for dependencies

What the heck is this data!?

Well, I made a quick & dirty prototype long ago with leap / oculus. I wanted to hook up a particleSystem in THREE.js up with some raycasting (not fun in three.js). And of course, I took an off the shelf particle system I wrote a while back (a <a href="http://vimeo.com/75047130">video on vimeo</a>) and plugged it in with HTML5 Audio API to explore/learn how to incorporate 3d sound into my projects... Awesome. 

If you like the particle system, play here: <a href="http://atpsmith.com">atpsmith.com</a>, background viz controls are in the top-right. Access the data object for the degrees (0-PI) in the console with "spaced.deg = 1.61803398875; (or whatever # you see fit)
To simplify what the data is: take a massive spiral, then unravel it equally over the Z plane, and (like pacman behaves), once I get to a certain point on an axis (Z), I repeat from the opposite point of the (Z) axis. Like a snake eating it's own tail...
