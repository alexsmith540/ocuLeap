var LeapControls = function(){
    /*
    A mashup with leap motion and oculus rift.
    Alex Smith, 2014 alexsmith_540@yahoo.com
    website: http://atpsmith.com
    */
};
LeapControls.prototype.initController = function(controls){
    this.leapCursor = new THREE.Vector3(0,0,0);
    this.leapCursorReference = new THREE.Vector3(0,0,0);
    this.leapCursorSet = false;
    this.controls = controls;//three trackball controls

    this.controller = new Leap.Controller({enableGestures:true});
    var i = 0;
    var that = this;

    this.controller.on('animationFrame', function(frame) {
      if(i % 100 == 0) console.log("hello frame",frame)
      i++;
      that.handleFrameData(frame);

    })
    this.controller.connect({enableGestures:true});
    $(document).on('keydown',function(e){
        console.log('kd',e)
        if(e.keyCode == 82){
            console.log('reset')
            //'r' key has been pressed, recalibrate our center point...
            that.leapCursorReference = new THREE.Vector3(0,0,0);
            that.leapCursor = new THREE.Vector3(0,0,0);
            that.leapCursorSet = false;
        }
    })
}
LeapControls.prototype.handleFrameData = function(frameData){
    var that = this;
    if(typeof frameData.handsMap != "undefined")
    $.each(frameData.handsMap,function(i,hand){
        if(typeof hand.fingers != "undefined"){
            if(hand.fingers.length == 1){
                if(!that.leapCursorSet && Math.abs(hand.fingers[0].tipVelocity[0]) < 1 && Math.abs(hand.fingers[0].tipVelocity[1]) < 1 && Math.abs(hand.fingers[0].tipVelocity[2]) < 1){
                    console.log('setting finger')
                    var f = hand.fingers[0];
                    fingx = f.tipPosition[0];
                    fingy = f.tipPosition[1];
                    fingz = f.tipPosition[2];
                    that.leapCursorReference = new THREE.Vector3(fingx,fingy,fingz);
                    that.leapCursorSet = true;
                }
                else{
                    //ok we have a finger reference coordinate that we can scale to...
                    //is pointer finger
                    var f = hand.fingers[0];
                    fingx = f.tipPosition[0];
                    fingy = f.tipPosition[1];
                    fingz = f.tipPosition[2];
                    var xMin = that.leapCursorReference.x - 100;
                    var xMax = that.leapCursorReference.x + 100;
                    var yMin = that.leapCursorReference.y - 100;
                    var yMax = that.leapCursorReference.y + 100;
                    var zMax = that.leapCursorReference.z - 100;
                    var zMin = that.leapCursorReference.z + 100;
                    that.leapCursor.x = that.map(fingx + (fingx * Math.abs(f.direction[0])),xMin,xMax,0,$(window).width());
                    that.leapCursor.y = that.map(fingy + (fingy * f.direction[1]),yMin,yMax,$(window).height(),0);
                    $('#leapCursor').css({left:that.leapCursor.x,top:that.leapCursor.y});
                }
                
            }
            else if(hand.fingers.length >= 4){
                    var f = hand.fingers[0];
                        fingx = f.tipPosition[0];
                        fingy = f.tipPosition[1];
                        fingz = f.tipPosition[2];
                    var xMin = that.leapCursorReference.x - 200;
                    var xMax = that.leapCursorReference.x + 200;
                    var yMin = that.leapCursorReference.y - 200;
                    var yMax = that.leapCursorReference.y + 200;
                    var zMax = that.leapCursorReference.z + 200;
                    var zMin = that.leapCursorReference.z - 200;
                    var lcold = that.leapCursor.clone();
                    that.leapCursor.x = that.map(fingx + (fingx*2 * Math.abs(f.direction[0])),xMin,xMax,0,$(window).width());
                    that.leapCursor.y = that.map(fingy + (fingy*2 * f.direction[1]),yMin,yMax,$(window).height(),0);
                    //$('#leapCursor').css({left:that.leapCursor.x,top:that.leapCursor.y});
                //that.controls.leapRotate(that.leapCursor,lcold);
                that.controls.moveObject.translateX(that.map(fingx /*+ (fingx*2 * f.direction[0])*/,xMin,xMax,-0.001,0.001))
                that.controls.moveObject.translateY(that.map(fingy /*+ (fingy*2 * f.direction[1])*/,yMin,yMax,-0.001,0.001))
                that.controls.moveObject.translateZ(that.map(fingz/* + (fingz*2 * f.direction[2])*/,zMin,zMax,-0.001,0.001))


            }
            else if(hand.fingers.length == 2){
                var fingavg = {x:0,y:0,z:0};
                $.each(hand.fingers,function(fi,fing){
                    //console.log('fing',fing.tipPosition)
                    fingavg.x += fing.tipPosition[0];
                    fingavg.y += fing.tipPosition[1];
                    fingavg.z += fing.tipPosition[2];
                })
                //console.log('fingacg',fingavg)
                fingavg.x /= hand.fingers.length;
                fingavg.y /= hand.fingers.length;
                fingavg.z /= hand.fingers.length;
                //console.log('fingacg',fingavg)
                var y = that.map(fingavg.z,-2000,2000,-0.1,0.1);
                //that.controls.leapZoom(-y);
                console.log('handpos',hand.palmPosition,y)
            }
            else{
                /*$('#leapCursor').hide();*/
            }
        }
    })
}
LeapControls.prototype.map = function(value, istart, istop, ostart, ostop) {
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart))
};
LeapControls.prototype.toVector = function(vectorIn){
    return new THREE.Vector3(vectorIn[0],vectorIn[1],vectorIn[2]);
}