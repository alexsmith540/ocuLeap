/**
 * Based on THREE.PointerLockControls by mrdoob.
 * @author benvanik
 */

THREE.OculusRiftControls = function ( camera ) {

  var scope = this;
  this.enabled = false;
  //this.moveObject = moveObject;
  this.moveObject = new THREE.Object3D();
  this.moveObject.position.y = 0;
  this.moveObject.position.z = -100;
  this.moveObject.up = new THREE.Vector3(1,0,0)
  //this.moveObject.position = new THREE.Vector3(0,0,0);
  //this.moveObject.rotation = new THREE.Vector3( 1.5918119481220838, -1.0683896931398054,  -3.071813566035451)
  this.moveObject.add( camera );
  this.leapZ_Translation = 0;
  var moveForward = false;
  var moveBackward = false;
  var moveLeft = false;
  var moveRight = false;
  var moveUp = false;
  var moveDown = false;
  var isOnObject = false;
  var canJump = false;
  this.speedX = 0;
  this.speedY = 0;
  this.speedZ = 0;
  var velocity = new THREE.Vector3();

  var PI_2 = Math.PI / 2;

  this.moveSpeed = 0.1 / 4;
  this.jumpSpeed = 2;

  var _q1 = new THREE.Quaternion();
  var axisX = new THREE.Vector3( 1, 0, 0 );
  var axisZ = new THREE.Vector3( 0, 0, 1 );
  var that =this;
  var onMouseMove = function ( event ) {
    //console.log('mousemove',scope)
    /*if ( scope.enabled === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    console.log(movementX, movementY);

    _q1.setFromAxisAngle( axisZ, movementX * 0.002 );
    that.moveObject.quaternion.multiply( _q1 );
    _q1.setFromAxisAngle( axisX, movementY * 0.002 );
    that.moveObject.quaternion.multiply( _q1 );*/

  };

  var onKeyDown = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true; break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

      case 32: // space
        if ( canJump === true ) velocity.y += this.jumpSpeed;
        canJump = false;
        break;

    }

  }.bind(this);

  var onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // a
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;

    }

  };
  var that = this;
  $(document).on('moveForward',function(e,meta){
    moveForward = true;
    moveBackward = false;
    that.speedZ = meta;
  })
  $(document).on('moveBackward',function(e,meta){
    moveBackward = true;
    moveForward = false;
    that.speedZ = meta;
  })
  $(document).on('moveRight',function(e,meta){
    moveRight = true;
    moveLeft = false;
    that.speedX = meta;
  })
  $(document).on('moveLeft',function(e,meta){
    moveLeft = true;
    moveRight = false;
    that.speedX = meta;
  });
  $(document).on('moveUp',function(e,meta){
    moveUp = true;
    moveDown = false;
    that.speedY = meta;
  })
  $(document).on('moveDown',function(e,meta){
    moveDown = true;
    moveUp = false;
    that.speedY = meta;
  });
  $(document).on('endMovement',function(e,meta){
    moveUp = false;
    moveDown = false;
    moveLeft = false;
    moveRight = false;
    moveForward = false;
    moveBackward = false;
    that.speedX = 0;
    that.speedY = 0;
    that.speedZ = 0;
    velocity.x = 0;
    velocity.y = 0;
    velocity.z = 0;
  })
  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  //this.enabled = false;

  this.getObject = function () {

    return this.moveObject;

  };

  this.isOnObject = function ( boolean ) {

    isOnObject = boolean;
    canJump = boolean;

  };

  this.update = function ( delta, vrstate ) {

    //if ( scope.enabled === false ) return;

    delta *= 0.1;

    /*velocity.x += ( - velocity.x ) * 0.08 * delta;
    velocity.z += ( - velocity.z ) * 0.08 * delta;*/

    //velocity.y -= 0.10 * delta;

    if ( moveForward ) velocity.z = -this.moveSpeed * this.speedZ * delta;
    if ( moveBackward ) velocity.z = this.moveSpeed * this.speedZ * delta;

    if ( moveLeft ) velocity.x = -this.moveSpeed * this.speedX * delta;
    if ( moveRight ) velocity.x = this.moveSpeed * this.speedX * delta;

    /*if ( isOnObject === true ) {

      velocity.y = Math.max( 0, velocity.y );

    }*/
    if(moveUp){
      velocity.y = this.moveSpeed * this.speedY * delta;
    }
    if(moveDown){
      velocity.y = -this.moveSpeed * this.speedY * delta;
    }

    var rotation = new THREE.Quaternion();
    var angles = new THREE.Vector3();
    
    if (vrstate) {
      rotation.set(
        vrstate.hmd.rotation[0],
        vrstate.hmd.rotation[1],
        vrstate.hmd.rotation[2],
        vrstate.hmd.rotation[3]
      );
      //this.moveObject.quaternion.set(rotation);

      //console.log('vec is',vec,angles)
      /*
      angles.setEulerFromQuaternion(rotation, 'XYZ');
      //angles.z = 0;
      angles.normalize();
      //this.moveObject.rotation = angles;
      rotation.setFromEuler(angles, 'XYZ');
      //this.moveObject.useQuaternion = false;
      rotation.normalize();
      
      var vec = new THREE.Vector3(0,0,0);*/
      rotation.normalize();
      /*deprecated: var q2e = this.quatToEuler(rotation);
      nice, threejs added setFromQuaternion...*/
      this.moveObject.rotation.setFromQuaternion( rotation, 'XYZ' );
      
    }
    //this.moveObject.lookAt(angles)
    this.moveObject.updateMatrix();
    //velocity.y = 0;
    this.moveObject.translateX( velocity.x );
    this.moveObject.translateY( velocity.y );
    this.moveObject.translateZ( velocity.z );
    //this.moveObject.position.x += velocity.x;
    //this.moveObject.position.y += velocity.x;
    //this.moveObject.position.z += velocity.x;

    //this.moveObject.quaternion.multiplyBy(rotation);
    /*if ( this.moveObject.position.y < -5 ) {

      velocity.y = 0;
      this.moveObject.position.y = -5;

      canJump = true;

    }*/

  };
  // Pass the obj.quaternion that you want to convert here:
  //*********************************************************
  this.quatToEuler = function(q1) {
      var pitchYawRoll = new THREE.Vector3();
       sqw = q1.w*q1.w;
       sqx = q1.x*q1.x;
       sqy = q1.y*q1.y;
       sqz = q1.z*q1.z;
       unit = sqx + sqy + sqz + sqw; // if normalised is one, otherwise is correction factor
       test = q1.x*q1.y + q1.z*q1.w;
      if (test > 0.499*unit) { // singularity at north pole
          heading = 2 * Math.atan2(q1.x,q1.w);
          attitude = Math.PI/2;
          bank = 0;
          return;
      }
      if (test < -0.499*unit) { // singularity at south pole
          heading = -2 * Math.atan2(q1.x,q1.w);
          attitude = -Math.PI/2;
          bank = 0;
          return;
      }
      else {
          heading = Math.atan2(2*q1.y*q1.w-2*q1.x*q1.z , sqx - sqy - sqz + sqw);
          attitude = Math.asin(2*test/unit);
          bank = Math.atan2(2*q1.x*q1.w-2*q1.y*q1.z , -sqx + sqy - sqz + sqw)
      }
      pitchYawRoll.z = Math.floor(attitude * 1000) / 1000;
      pitchYawRoll.y = Math.floor(heading * 1000) / 1000;
      pitchYawRoll.x = Math.floor(bank * 1000) / 1000;

      return pitchYawRoll;
  }        

  // Then, if I want the specific yaw (rotation around y), I pass the results of
  // pitchYawRoll.y into the following to get back the angle in radians which is
  // what can be set to the object's rotation.

  //*********************************************************
  this.eulerToAngle = function(rot) {
      var ca = 0;
      if (rot > 0)
          { ca = (Math.PI*2) - rot; } 
      else 
          { ca = -rot }

      return (ca / ((Math.PI*2)/360));  // camera angle radians converted to degrees
  }
};

