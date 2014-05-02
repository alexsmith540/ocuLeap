var ocuLeap = function(){
    /*
    A mashup with leap motion and oculus rift.
    Alex Smith, 2014 alexsmith_540@yahoo.com
    website: http://atpsmith.com
    */
};
ocuLeap.prototype.init = function(){
	this.deg = 0;
	this.deg_increment = 10;
	this.radius = 50;
    this.particleCount = 10800;
    this.clock = new THREE.Clock();
	this.scene = new THREE.Scene();
	// set the scene size
	var WIDTH = $(window).width(),
	  HEIGHT = $(window).height();

	// set some camera attributes
	var VIEW_ANGLE = 45,
	  ASPECT = WIDTH / HEIGHT,
	  NEAR = 0.1,
	  FAR = 10000;
	var container = $('body');

	// create a WebGL renderer, camera
	// and a scene
	
	this.camera =
	  new THREE.PerspectiveCamera(
	    VIEW_ANGLE,
	    ASPECT,
	    NEAR,
	    FAR);
	this.scene.add(this.camera);
	this.handSensitivity = 2; //# that we divide our actual points by to move our hands
	var mat = new THREE.MeshBasicMaterial({wireframe:true,color:0xff00ff});
	var geo = new THREE.SphereGeometry(3,3,2);

	this.testMesh = new THREE.Mesh(geo,mat);
	//this.scene.add(this.testMesh);
	
	this.container = document.createElement('div');
    document.body.appendChild(this.container);

    // renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(WIDTH,HEIGHT);

    this.container.appendChild(this.renderer.domElement);
    this.makeParticles();
    this.initFancyPantsShaders();
	this.animateScene();
	this.initLeapController();
	var that = this;
	
    vr.load(function(error) {
        if (error) {
          window.alert('VR error:\n' + error.toString());
        }
        that.state = new vr.State();
        that.createControls();
        
        setTimeout(function(){
            if(!that.state.hmd.present){

            //modify camera location if we're not rifted
                
                that.camera.position.set(0,0,-100);
                that.camera.lookAt(new THREE.Vector3(0,0,0));
            }
        },100)
        
    });
    this.screenW = window.innerWidth;
    this.screenH = window.innerHeight; /*SCREEN*/
    this.spdx = 0; this.spdy = 0; this.mouseX = 0; this.mouseY = 0; this.mouseDown = false; /*MOUSE*/
    
    /*for(i=0;i<25;i++){
    	var n = new THREE.Mesh(new THREE.CubeGeometry(1,1,1),mat);
    	var scale = Math.random()*5;
    	n.scale = new THREE.Vector3(scale,scale,scale);
    	n.position.z -= Math.random()*10;
    	that.scene.add(n);
    }*/
    
    this.projector = new THREE.Projector();
    this.attributes = {

        size: { type: 'f', value: [] },
        ca: { type: 'c', value: [] }

    };
    
    this.uniforms = {
        amplitude: { type: "f", value: 1.0 },
        color: { type: "c", value: new THREE.Color( 0xffffff ) },
        /*texture: { type: "t", value: THREE.ImageUtils.loadTexture( "disc.png" ) }*/
    };
    this.shaderMaterial = new THREE.ShaderMaterial( {
        uniforms: this.uniforms,
        attributes: this.attributes,
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent
    });
    
    /*that.positions[i * 3 + 0] = point.spherical_pos.x;
    that.positions[i * 3 + 1] = point.spherical_pos.y
    that.positions[i * 3 + 2] = point.spherical_pos.z*/
    
}
ocuLeap.prototype.initFancyPantsShaders = function(){
    //some zoom blur. I didnt like it so it's not being used...
    this.perlin_uniforms = { 
        tExplosion: { type: "t", value: THREE.ImageUtils.loadTexture( 'images/explosion-bw.png' ) },
        time: { type: "f", value: 0.0 },
        weight: { type: "f", value: 0.25 },
        noise_amt: {type:"f",value:23.0},
        pcolor : {type: "c",value:new THREE.Color(0x33ccee)}
    };
    this.perlinShader = new THREE.ShaderMaterial( {
        uniforms: this.perlin_uniforms,
        vertexShader: document.getElementById( 'perlin_vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'perlin_fragmentShader' ).textContent
        
    } );
    this.perlin_uniforms2 = { 
        tExplosion: { type: "t", value: THREE.ImageUtils.loadTexture( 'images/explosion-bw.png' ) },
        time: { type: "f", value: 0.0 },
        weight: { type: "f", value: 0.25 },
        noise_amt: {type:"f",value:32.0},
        pcolor : {type: "c",value:new THREE.Color(0x00ffff)}
    };
    this.fingerShader = new THREE.ShaderMaterial( {
        uniforms: this.perlin_uniforms2,
        vertexShader: document.getElementById( 'perlin_vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'perlin_fragmentShader' ).textContent
        
    } );

    //new THREE.Color(0x00ffff)this.fingerShader.uniforms['pcolor'].value = new THREE.Color(0x00ffff)
    this.perlin_uniforms2.tExplosion.value.wrapS = this.perlin_uniforms2.tExplosion.value.wrapT = THREE.RepeatWrapping;
    this.perlin_uniforms.tExplosion.value.wrapS = this.perlin_uniforms.tExplosion.value.wrapT = THREE.RepeatWrapping;
}
ocuLeap.prototype.initPostProcessing = function(){
    this.orthoProjector = new THREE.Projector();
    this.orthoScene = new THREE.Scene();
    this.orthoCamera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
    this.orthoScene.add( this.orthoCamera );
    
    this.baseTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { 
        minFilter: THREE.LinearFilter, 
        magFilter: THREE.LinearFilter, 
        format: THREE.RGBFormat 
    } );
    
    this.glowTexture = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { 
        minFilter: THREE.LinearFilter, 
        magFilter: THREE.LinearFilter, 
        format: THREE.RGBFormat 
    } );
    
    this.zoomBlurShader = new THREE.ShaderMaterial( {
        uniforms: { 
            tDiffuse: { type: "t", value: this.glowTexture },
            resolution: { type: "v2", value: new THREE.Vector2( window.innerWidth, window.innerHeight ) },
            strength: { type: "f", value: 0.1 },
            blurPct:{type:"f",value:0.01}
        },
        vertexShader: document.getElementById( 'blur_vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fs_ZoomBlur' ).textContent,
        
        depthWrite: false,
        
    } );

    this.zoomBlurShader.uniforms.tDiffuse.value.wrapS = this.zoomBlurShader.uniforms.tDiffuse.value.wrapT = THREE.RepeatWrapping;
    this.compositeShader = new THREE.ShaderMaterial( {

        uniforms: { 
            tBase: { type: "t", value: this.baseTexture },
            tGlow: { type: "t", value: this.glowTexture }
        },
        vertexShader: document.getElementById( 'blur_vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fs_Composite' ).textContent,
        depthWrite: false,
        
    } );
    this.compositeShader.uniforms.tBase.value.wrapS = this.compositeShader.uniforms.tBase.value.wrapT = THREE.RepeatWrapping;
    this.compositeShader.uniforms.tGlow.value.wrapS = this.compositeShader.uniforms.tGlow.value.wrapT = THREE.RepeatWrapping;
    var tempmat = new THREE.MeshBasicMaterial({color:0xffffff})
    this.quad = new THREE.Mesh( new THREE.PlaneGeometry(1,1 ),tempmat);
    //quad.position.z = -100;
    //quad.rotation.x = Math.PI / 2;
    this.quad.scale.x = window.innerWidth;
    this.quad.scale.y = window.innerHeight;
    this.orthoScene.add( this.quad );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    
    this.zoomBlurShader.uniforms[ 'resolution' ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
    this.orthoCamera.projectionMatrix.makeOrthographic( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
    //onWindowResize();
}
ocuLeap.prototype.initSounds = function(){
    var that = this;
    this.soundBank = [];
    console.log('init sounds',this.soundBank)
    //oh shit, thats right we'll make a 3d sound experience.
    this.audioContext = new webkitAudioContext();

    //ok first lets fire up some "universe" droning
    this.left_panner = this.audioContext.createPanner();
    this.left_panner.setPosition(-1, 0, 0);
    this.left_panner.setOrientation(1, 0, 0);
    this.right_panner = this.audioContext.createPanner();
    this.right_panner.setPosition(1, 0, 0);
    this.right_panner.setOrientation(-1, 0, 0);
    this.left_panner.connect(this.audioContext.destination)
    this.right_panner.connect(this.audioContext.destination)

    //this is known as a bineareal frequency.
    this.leftDrone = this.audioContext.createOscillator();
    this.leftDrone.type =0;
    this.leftDrone.frequency.value = 16;
    this.leftDrone.connect(this.left_panner);
    this.rightDrone = this.audioContext.createOscillator();
    this.rightDrone.frequency.value = 22.83;
    this.rightDrone.type =0;
    this.rightDrone.connect(this.right_panner)
    this.leftDrone.noteOn(0);
    this.rightDrone.noteOn(0);

    
    var cam = typeof that.controls != "undefined" ? that.controls.moveObject : that.camera;
    this.audioContext.listener.setPosition(cam.position.x,cam.position.y,cam.position.z);
    this.left_panner.setPosition(cam.position.x-1,cam.position.y,cam.position.z);
    this.right_panner.setPosition(cam.position.x+1,cam.position.y,cam.position.z);
    //harmonic triad [132,528,852,285];
    //Solfeggio frequencies [528,285,639,174,396,852,963,417,714]
    //awesome tension [714,417]
    //odd [174,285,396,471,582,693,741,852,963]
    //even [714,825,936,417,528,639,147,258,369]
    //[132,528,852,285]
    var presets = [528,285,639,174,396,852,963,417,714];
    var ps2 = [];
    $.each(presets,function(i,x){
        ps2.push(x+1.618);
    })
    presets = presets.concat(ps2);
    for(i=0;i<that.particleCount;i++){
        var posX = that.positions[i*3+0];
        var posY = that.positions[i*3+1];
        var posZ = that.positions[i*3+2];
        var notes = [];
        panner = this.audioContext.createPanner();
        panner.setPosition(posX, posY, posZ);
        panner.setOrientation(cam.x,cam.y,cam.z);

        
        //random
        var freq = presets[i%presets.length];
        /*console.log('frequency is',freq)*/
        osci = that.audioContext.createOscillator();
        osci.type =0;
        osci.frequency.value = freq;
        osci.connect(panner);
        //osci.noteOn(0);
        notes.push(osci);
        
        
        panner.connect(that.audioContext.destination);
        

        that.soundBank.push({panner:panner,osci:notes})
    }
}
ocuLeap.prototype.createControls = function(){
    var that = this;
    if(typeof that.controls == "undefined"){
        if(that.state.hmd.present){
            //oculus controls
            that.controls = new THREE.OculusRiftControls( that.camera );
            that.scene.add( that.controls.getObject() );

            that.effect = new THREE.OculusRiftEffect( that.renderer );
            that.effect.getInterpupillaryDistance().toFixed(3);
            
        }
        else{
            //we use some relatively easy threejs camera controls
            that.initLeapCameraController();
        }
    }
}
ocuLeap.prototype.makeParticles = function(){
	var that = this;
	
        



    // create the particle system
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.dynamic = true;
    this.particleGeometry.attributes = {

        position: {
            itemSize: 3,
            array: new Float32Array( this.particleCount * 3 ),
            numItems: this.particleCount * 3,
            dynamic:true
        },
        color: {
            itemSize: 3,
            array: new Float32Array( this.particleCount * 3 ),
            numItems: this.particleCount * 3,
            dynamic:true
        },
        size: {
            itemSize: 1,
            array: new Float32Array( this.particleCount),
            numItems: this.particleCount * 1,
            dynamic: true
        },

    }
    that.values_size = that.particleGeometry.attributes.size.array;
    that.positions = that.particleGeometry.attributes.position.array;
    that.values_color = that.particleGeometry.attributes.color.array;
    var material = new THREE.ParticleBasicMaterial( { size: 1, vertexColors: true, transparent:true,opacity:0.9 } );
    that.particleSystem = new THREE.ParticleSystem(that.particleGeometry,material);
	var c = new THREE.Color(0xffffff);
    // now create the individual particles
    for(var p = 0; p < this.particleCount; p++) {

      // create a particle with random
      // position values, -250 -> 250
      var pX = Math.random() * 500 - 250,
          pY = Math.random() * 500 - 250,
          pZ = Math.random() * 500 - 250;
          /*particle = new THREE.Vector3(pX, pY, pZ);
	  
      // add it to the geometry
      particles.vertices.push(particle);
      particles.vertices.speed = Math.random()*p;*/
	  that.values_size[p] = 0.25;
	  that.positions[p * 3 + 0] = pX;
	  that.positions[p * 3 + 1] = pY;
	  that.positions[p * 3 + 2] = pZ;
	  //that.soundBank[p].panner.setPosition(pX,pY,pZ);
	    //c.setHSL(1,1,1);
	    that.values_color[p * 3 + 0] = c.r;
	    that.values_color[p * 3 + 1] = c.g;
	    that.values_color[p * 3 + 2] = c.b;
    }
    /*that.particleGeometry.attributes.position.needsUpdate = true;
    that.particleGeometry.attributes.size.needsUpdate = true;
    that.particleGeometry.attributes.ca.needsUpdate = true;*/
    that.scene.add(that.particleSystem);
    this.initSounds();//uh oh...
    this.initPostProcessing();
    /*this.particleSystem =
      new THREE.ParticleSystem(
        particles,
        this.pMaterial);

    this.particleSystem.sortParticles = true;
    this.scene.add(this.particleSystem);*/
}
ocuLeap.prototype.animateScene = function(){
    //ok so if we don't skip a few frames of sound at init time, it sounds like your computer farts really loud. seriously. amazing.
    if(typeof this.isNotTheBeginning == "undefined"){
        this.isNotTheBeginning = false;
        this._soundbeginInt = 0;
    }
    else {
        if(!this.isNotTheBeginning){
            this._soundbeginInt++; 
            if(this._soundbeginInt >= 60){
                this.isNotTheBeginning = true;
            }
        }
    }

	var that = this;
	/*requestAnimationFrame( function(){
		that.animateScene();
	} );*/
	if(typeof that.state != "undefined"){
		var polled = vr.pollState(that.state);
		vr.requestAnimationFrame(function(){that.animateScene();});
	}
	else{
		requestAnimationFrame( function(){
			that.animateScene();
		} );
	}
	if(typeof that.state != "undefined"){
        if (!that.state.hmd.present) {
            //console.log('no state present')
            //that.renderer.clear();
            //that.renderer.render(that.orthoScene,that.orthoSamera);
            that.renderer.render(that.scene,that.camera/*,that.baseTexture,true*/);

            //that.effect.render( that.scene, that.camera,polled ? that.state : null,that.baseTexture,true );
            /*that.quad.material = that.zoomBlurShader;
            that.quad.material.uniforms[ 'tDiffuse' ].value = that.baseTexture;
            that.renderer.render(that.orthoScene,that.orthoCamera,that.glowTexture,false)
            //that.effect.render( that.scene, that.camera,polled ? that.state : null,that.glowTexture,false );
                
            that.quad.material = that.compositeShader;
            that.quad.material.uniforms[ 'tBase' ].value = that.baseTexture;
            that.quad.material.uniforms[ 'tGlow' ].value = that.glowTexture;

            that.renderer.render(that.orthoScene,that.orthoCamera); */ 

            //that.effect.render( that.orthoScene, that.orthoCamera,polled ? that.state : null );
            /*that._hmd.rotation = that.controls.object.rotation;
            that._hmd.children[0].up = that.controls.object.up;
            that._hmd.children[0].useQuaternion = true;
            that._hmd.children[0].quaternion = that.controls.object.quaternion;
            that._hmd.children[0].lookAt(that.controls.target);
            that._hmd.children[0].matrix = that.controls.object.matrix;*/
        }
        else{
            if(that.state.hmd.present){
                if(typeof that.controls == "undefined"){
                    that.createControls();
                }
                //$('#hmd').html(JSON.stringify(that.state.hmd.rotation));
                /*that._hmd.rotation.x = that.state.hmd.rotation[1]
                that._hmd.rotation.y = that.state.hmd.rotation[2]
                that._hmd.rotation.z = that.state.hmd.rotation[3]*/
                
                //that.renderer.render( that.scene, that.controls.object );
                //that.controls.update();
                //that.controls.object.updateProjectionMatrix();
                that.controls.update( Date.now() - time, polled ? that.state : null );
                //that.controls.update();
                //that.renderer.render(that.scene,that.camera);
                that.effect.render( that.scene, that.camera, polled ? that.state : null );
                /*that.effect.render( that.scene, that.camera,polled ? that.state : null,that.baseTexture,true );
                that.quad.material = that.zoomBlurShader;
                that.quad.material.uniforms[ 'tDiffuse' ].value = that.baseTexture;
                
                that.effect.render( that.scene, that.camera,polled ? that.state : null,that.glowTexture,false );
                
                that.quad.material = that.compositeShader;
                that.quad.material.uniforms[ 'tBase' ].value = that.baseTexture;
                that.quad.material.uniforms[ 'tGlow' ].value = that.glowTexture;
                
                that.effect.render( that.orthoScene, that.orthoCamera,polled ? that.state : null );*/
                
            }
        }
    }
    var cam = typeof that.controls != "undefined" ? that.controls.moveObject : that.camera;
    this.audioContext.listener.setPosition(cam.position.x,cam.position.y,cam.position.z);
    this.left_panner.setPosition(cam.position.x-1,cam.position.y,cam.position.z);
    this.right_panner.setPosition(cam.position.x+1,cam.position.y,cam.position.z);

    time = Date.now();
    var delta = 5 * this.clock.getDelta();

    this.perlin_uniforms.time.value += (0.05) * delta;
    this.perlin_uniforms2.time.value += (0.08) * delta;
    //this.renderer.render( this.scene, this.camera );
    //and now make particles do magic
    var c = new THREE.Color(0xccdddd);
    for(i=0;i<this.particleCount;i++){

        var temp_rad = (i/this.particleCount)*(this.radius+i*0.001);//(this.FAR/8/this.camera.position.z));

        //this.particleSystem.geometry.vertices[i].y = Math.cos(i*this.deg+i)*temp_rad;//*(i/360)/this.particleSystem.geometry.vertices[i].speed;
        that.positions[i * 3 + 0] = Math.sin(i*this.deg+i)*temp_rad; //x
        that.positions[i * 3 + 1] = Math.cos(i*this.deg+i)*temp_rad;//y
        that.positions[i * 3 + 2] = Math.tan(i*this.deg)*this.radius;//z
        //if(typeof that.soundBank != "undefined")
        that.soundBank[i].panner.setPosition(that.positions[i * 3 + 0],that.positions[i * 3 + 1],that.positions[i * 3 + 2]);
        if(cam.position.distanceTo(new THREE.Vector3(that.positions[i * 3 + 0],that.positions[i * 3 + 1],that.positions[i * 3 + 2])) <= 10){
            $.each(that.soundBank[i].osci,function(ii,osci){
                osci.connect(that.soundBank[i].panner);
                osci.frequency += this.deg_increment * 0.0000001;
                try{
                    if(that.isNotTheBeginning) osci.noteOn(0);
                }
                catch(e){

                }
            })
        }

        /*else{
            if(typeof that.collided != "undefined"){
            if($.inArray(i,that.collided) != -1){
                //oh we should totally make this badboy sing...
                $.each(that.soundBank[i].osci,function(ii,osci){
                    osci.connect(that.soundBank[i].panner);
                    osci.noteOn(0);
                })
            }
        }*/
        else
            $.each(that.soundBank[i].osci,function(ii,osci){
                osci.disconnect();
            })
        
        that.values_size[i] = 0.25;

        c.r = that.map(temp_rad,0,that.radius,0.7,0.8);
        c.g = that.map(temp_rad,0,that.radius,0.8,0.9);
        c.b = that.map(temp_rad,0,that.radius,1.0,0.9);
        if(typeof that.collided != "undefined"){
            if($.inArray(i,that.collided) != -1 && that.collided.length > 0){
                //oh we should color this particle or play sounds etc etc...
                c.r = 1;
                c.g = 0;
                c.b = 0;
                $.each(that.soundBank[i].osci,function(ii,osci){
                    osci.connect(that.soundBank[i].panner);
                    //osci.noteOn(0);
                    try{
                        osci.noteOn(0);
                    }
                    catch(e){
                        //die a silent death, thanks...
                        //https://code.google.com/p/chromium/issues/detail?id=324652

                        //console.log('error',e)
                    }
                })
            }
        }
        
        that.values_color[i * 3 + 0] = c.r;
        that.values_color[i * 3 + 1] = c.g;
        that.values_color[i * 3 + 2] = c.b;

        //this.particleSystem.geometry.vertices[i].x = Math.sin(i*this.deg+i)*temp_rad;//*(i/360)/this.particleSystem.geometry.vertices[i].speed;

        //this.particleSystem.geometry.vertices[i].z = Math.tan(i*this.deg)*this.radius;

    }
    that.particleGeometry.attributes.position.needsUpdate = true;
    that.particleGeometry.attributes.size.needsUpdate = true;
    that.particleGeometry.attributes.color.needsUpdate = true;
    this.deg = parseFloat(this.deg);
    if(this.deg >= 0.11) this.is_positive = false;
    if(this.deg <= 0.1) this.is_positive = true;
    var degi = this.deg_increment * 0.0000001;
    this.deg+= this.is_positive ? degi : -degi;
}
ocuLeap.prototype.getIntersection = function(ray){
    var that = this;
    //these are the available attributes in ray that I can use
        //ray.origin.x/y/z
    //ray.direction.x/y/z
    var threashold=1000;
    var retpoint=false;
    
        //console.log('ray is',ray);
        ray = ray.ray;
        //ray.origin.y -= 50;
        var distance=1;
        //for(var i=0;i<group_points.children.length;i++){
            //console.log('point0',that.pmesh.geometry.vertices[4000]);
            //var arr = that.positions;
            //console.log('positions',that.positions)
            //console.log('that geo attr',that.pmesh.geometry.attributes.position)
            for(var j=0;j<that.particleSystem.geometry.attributes.position.numItems/3;j++){
                var point = new THREE.Vector3(that.positions[j*3+0],that.positions[j*3+1],that.positions[j*3+2]);//that.pmesh.geometry.vertices[j];
                //first detect collison of finger with particle
                /*if (point.distanceTo(ray.origin) <= 100){
                    if(retpoint == false){
                        retpoint = [j];
                    }
                    else{
                       retpoint.push(j); 
                    }
                    
                }*/
                //now test the direction we're pointing at
                var scalar = (point.x - ray.origin.x) / ray.direction.x;
                //if(j % 4000 == 0) console.log('scalar',scalar)
                //console.log('scalar',point)
                if(scalar<0) continue;//this means the point was behind the camera, so discard
                //test the y scalar
                var testy = (point.y - ray.origin.y) / ray.direction.y;

                if(Math.abs(testy - scalar) > threashold) continue;
                //test the z scalar
                var testz = (point.z - ray.origin.z) / ray.direction.z
                //if(j % 4000 == 0) console.log('testz',testz);
                if(Math.abs(testz - scalar) > threashold) continue;
                
                //if it gets here, we have a hit!
                if(distance>scalar){
                    distance=scalar;
                    if(retpoint == false){
                        retpoint = [j];
                    }
                    else{
                       retpoint.push(j); 
                    }
                    
                }
            }
    return retpoint;
}
ocuLeap.prototype.initLeapCameraController = function(){
    var that = this;
    setTimeout(function(){
            if(!that.state.hmd.present){
        var speeds = 0.001;
        $(document).on('moveLeft',function(e,metaNum){

            that.camera.translateX(-metaNum);//-speeds);
        })
        $(document).on('moveRight',function(e,metaNum){
            that.camera.translateX(metaNum);//speeds);
        })
        $(document).on('moveUp',function(e,metaNum){
            that.camera.translateY(metaNum);//speeds);
        })
        $(document).on('moveDown',function(e,metaNum){
            console.log('down',-metaNum*2);//down is tough since it's theoretically close to the oculus. Let's bump up the multiplier a bit
            that.camera.translateY(-metaNum*2);//-speeds);
        })
        $(document).on('moveForward',function(e,metaNum){
            //console.log("metanum",metaNum)
            that.camera.translateZ(-metaNum);//-speeds);
        })
        $(document).on('moveBackward',function(e,metaNum){
            that.camera.translateZ(metaNum);//speeds);
        })
        $(document).on('circleGesture',function(){
            that.camera.rotation.y += 0.03;
        })
    }
},1000);
}
ocuLeap.prototype.handleFrameData = function(frameData){
	//handles leap frames
	var that = this;
	if(typeof frameData.gestures != "undefined"){
		if(frameData.gestures.length >= 0){
			$.each(frameData.gestures,function(i,gesture){
				if(gesture.type == 'circle'){
                    /*if(typeof that.controls != "undefined")
					that.controls.leapZ_Translation+=0.01;*/
                    $(document).trigger('circleGesture');
				}
			})
		}
	}
    if(typeof frameData.handsMap != "undefined"){
    	var iter = 0;
	    //console.log('handmap',frameData.handsMap)
	    $.each(frameData.handsMap,function(i,hand){

	    	var myHand = iter == 0 ? that.hand1 : that.hand2;
	    	//console.log('trytin',myHand,hand)
	    	//sorry no 3rd hand right now...
	    	
	    	if(iter < 2){

	    		if(typeof hand.fingers != "undefined"){
	    			if(hand.fingers.length >= 4){
                        //lets go flymode
                        var avg = [0,0,0]
                        $.each(hand.fingers,function(ii,x){
                            avg[0] += x.tipPosition[0];
                            avg[1] += x.tipPosition[1];
                            avg[2] += x.tipPosition[2];
                        });
                        var l = hand.fingers.length;
                        var avg = [avg[0]/l,avg[1]/l,avg[2]/l];
                        $('#debug').html('avg '+avg[0]+' '+avg[1]+' '+avg[2]+' distance '+that.leapCursorReference.distanceTo(new THREE.Vector3(avg[0],avg[1],avg[2])))
                        //multiply speed as by a factor of the sphere radius of the hand
                        var multiplier = Math.abs(that.map(hand.sphereRadius,20,100,0.05,1));
                        var distMultiplier = that.leapCursorReference.distanceTo(new THREE.Vector3(avg[0],avg[1],avg[2]));
                        distMultiplier = that.map(distMultiplier,60,400,0,1);
                        multiplier *= distMultiplier;
                        $('#debug').append('mult '+multiplier)
                        
                        //take the distance from our relative center of the hand scene (where we first saw you)
                        //then the farther away we are, the faster we go. Plus the bigger the sphere, the bigger the movement

                        if(avg[0] > 0){
                            //x > 0
                            $(document).trigger('moveRight',Math.abs(that.map(avg[0],-200,200,-2,2))*multiplier)
                        }
                        if(avg[0] < 0){
                            //x < 0
                            $(document).trigger('moveLeft',Math.abs(that.map(avg[0],-200,200,-2,2))*multiplier)
                        }
                        if(avg[1] > 150){
                            $(document).trigger('moveUp',Math.abs(that.map(avg[1],0,300,-2,2))*multiplier)
                        }
                        if(avg[1] < 150){
                            $(document).trigger('moveDown',Math.abs(that.map(avg[1],0,300,-2,2))*multiplier)
                        }
                        if(avg[2] < 0){
                            $(document).trigger('moveForward',Math.abs(that.map(avg[2],-100,100,-2,2))*multiplier)
                        }
                        if(avg[2] > 0){
                            $(document).trigger('moveBackward',Math.abs(that.map(avg[2],-150,50,-2,2))*multiplier)
                        }
                    }
                    else{
                        $(document).trigger('endMovement');
                        $('#debug').html('no flying now');
                    }
		        	var d = [];

		        	$.each(hand.fingers,function(ii,x){
		        		d.push({position:new THREE.Vector3(x.tipPosition[0]/that.handSensitivity,x.tipPosition[1]/that.handSensitivity,x.tipPosition[2]/that.handSensitivity),fingerId:x.id,data:x});
		        	})
		        	//console.log('updating',myHand,d)
		        	
		        	
					
					var pitchAng = Math.atan2( hand.direction[1] , -hand.direction[2] );
		            
		            var x = pitchAng;

		            var rollAng = Math.atan2( hand.palmNormal[0], hand.palmNormal[1] );
		            var z = rollAng;             

		            var yawAng = Math.atan2( hand.direction[0], -hand.direction[1] );
		            var y = yawAng;
					
					var direction = new THREE.Vector3(x,y,z);
					
		        	myHand.update({fingers:d,palm:{sphereRadius:hand.sphereRadius,position:new THREE.Vector3(hand.palmPosition[0]/that.handSensitivity,hand.palmPosition[1]/that.handSensitivity,hand.palmPosition[2]/that.handSensitivity),lookat:direction},_self:that})
		        }
	    	}
	      	iter++;  
	    })
	}
}
ocuLeap.prototype.map = function(value, istart, istop, ostart, ostop) {
    //use this badboy for linear scaling. Thanks processing.js for this method :)
  return ostart + (ostop - ostart) * ((value - istart) / (istop - istart))
};
ocuLeap.prototype.initLeapController = function(){
	this.handMin = -100/(this.handSensitivity)
	this.hand1 = new handModel(this);
	this.hand2 = new handModel(this);
	this.camera.add(this.hand2.model);
	this.hand2.model.translateZ(this.handMin).translateY(this.handMin);
	this.camera.add(this.hand1.model);
	this.hand1.model.translateZ(this.handMin).translateY(this.handMin);
	this.leapCursor = new THREE.Vector3(0,0,0);
    this.leapCursorReference = new THREE.Vector3(0,0,0);
    this.leapCursorSet = false;

    this.controller = new Leap.Controller({enableGestures:true});
    //var i = 0;
    var that = this;

    this.controller.on('animationFrame', function(frame) {
      /*
        //to debug a frame::
      if(i % 100 == 0) console.log("hello frame",frame)
      i++;*/
      that.handleFrameData(frame);

    })
    this.controller.connect({enableGestures:true});
    $(document).on('keydown',function(e){
        //console.log('kd',e)
        if(e.keyCode == 82){
            console.log('reset key pressed')
            //r key has been pressed, recalibrate our center point...
            that.leapCursorReference = new THREE.Vector3(0,0,0);
            that.leapCursor = new THREE.Vector3(0,0,0);
            that.leapCursorSet = false;
        }
    })
}
var handModel = function(_self){
    this._self = _self;
	this.handMin = _self.handMin;
	this.model = new THREE.Object3D();
	this.palmMaterial = _self.perlinShader;//new THREE.MeshBasicMaterial({wireframe:true,color:0xff0000});
	this.palmGeometry = new THREE.IcosahedronGeometry(5,3)
    
	this.palm = new THREE.Mesh(this.palmGeometry,this.palmMaterial);
	this.model.add(this.palm);

	this.fingerGroup = new THREE.Object3D();
	this.fingerMaterial = _self.fingerShader; 
	this.fingerGeometry = new THREE.OctahedronGeometry(5,4);
    /*8*/
    //_self.scene.add(l);
    this.fingerArrows = new THREE.Object3D();
	for(i=0;i<5;i++){
		this.fingerGroup.add(new THREE.Mesh(this.fingerGeometry,this.fingerMaterial));
        this.fingerArrows.add(new THREE.ArrowHelper(new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,0),20,new THREE.Color(0x00ff00)));
	}
	this.model.add(this.fingerGroup);
    this.model.add(this.fingerArrows);
};
handModel.prototype.update = function(data){
	var that = this;
    var _app = data['_self'];
    //console.log('app is',data)
    var allFingerCollisions = [];
    var sphereSize = data.palm.sphereRadius;
    var sv = _app.map(data.palm.sphereRadius,0,110,0.01,1);
    this.palm.scale = new THREE.Vector3(sv,sv,sv);
	$.each(data.fingers,function(i,finger){

		that.fingerGroup.children[i].position = finger.position;
		that.fingerGroup.children[i].fingerId = finger.finderId;
		that.fingerGroup.children[i].translateZ(that.handMin);
        var fingerData = finger.data;
        var direction = new THREE.Vector3(fingerData.direction[0],fingerData.direction[1],fingerData.direction[2]);
        
        var cmra = typeof _app.controls == "undefined" ? _app.camera : _app.controls.moveObject;
        //_app.projector.unprojectVector(_app.camera, that.fingerGroup.children[i].position);
        //var ray = new THREE.Raycaster(that.fingerGroup.children[i].position, direction);
        var ray = new THREE.Raycaster(that.fingerGroup.children[i].position, direction);
        that.fingerArrows.children[i].position = finger.position;
        that.fingerArrows.children[i].setDirection(direction);
        that.fingerArrows.children[i].setLength(20);
        //console.log('ray is',ray)
        var collision = _app.getIntersection(ray);
        //raycasting in three.js is made very hard with a particlesystem since the particles technically dont exist in world space, just in shader space, if that makes sense.
        //octree approach is ideal >1M vertices but underneath, it's faster to iterate over all points.

        allFingerCollisions = allFingerCollisions.concat(collision);
	});
    _app.collided = allFingerCollisions;
	this.palm.position = data.palm.position;
	this.palm.rotation.x = data.palm.lookat.x;
	this.palm.rotation.y = data.palm.lookat.y;
	this.palm.rotation.z = data.palm.lookat.z;
	
	
	if(data.fingers.length < 5){
		for(i=data.fingers.length;i<5;i++){
			that.fingerGroup.children[i].translateZ(200);
		}
	}
}