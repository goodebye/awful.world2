class Cloud {
  constructor(x, y) {
    this.img = loadImage('/js/clouds/cloud.png');
    this.pos = createVector(x, y);
    this.vel = randomReasonableSpeed();
    this.rot = Math.random() * TWO_PI;
    this.scale = Math.random() + .8;
    this.traveled = createVector(0, 0);
  }

  update() {
    let dampening = -.025;
      console.log(pwinMouseX, winMouseX, "hm");
    this.pos.add(createVector((winMouseX - pwinMouseX) * dampening, (winMouseY - pwinMouseY) * dampening));

  }


  addWind(wind) {
    this.pos.add(wind.x, wind.y);
    this.traveled.add(this.wind);
    this.pos.add(randomWobble());
  }

  draw() {
      push();
      translate(this.pos.x, this.pos.y);
      scale(this.scale);
      image(this.img, 0, 0);
      noTint();
      pop();
  }

  isTimeToDie() {
     if (this.traveled.x > width + this.img.width * this.scale 
         && this.traveled.y > height + this.img.height * this.scale) {
         console.log("bye bitch!");
         return true;
     }
     return false;
  }
}

class Sun {
    constructor(x, y) {
      this.pos = createVector(x, y);
      this.img = loadImage("/js/clouds/sun.png");
      this.rot = Math.random() * TWO_PI;
      this.scale = 2;
      this.rotSpeed = 0.001;
    }

    update() {
      let wob = randomWobble();
      this.pos.add(wob);
      this.rot = (this.rot + this.rotSpeed) % TWO_PI;

    let dampening = -.02;
    this.pos.add(createVector((winMouseX - pwinMouseX) * dampening, (winMouseY - pwinMouseY) * dampening));
    } 

    draw() {
      //let wob = randomWobble();

      push();
      translate(this.pos.x, this.pos.y);
      scale(this.scale);
      rotate(this.rot);
      //image(this.img, 0 + wob.x, 0 + wob.y);     
      image(this.img, 0, 0);     
      pop();
    }
}

class CloudGenerator {
  constructor() {
    this.lastFrame = frameCount;
    this.framesTilCloud = this.nextCloudDrop();
    this.init();
  }
  init() {
    //cover the screen;
    for (let i = 0; i < 40; i++) {
      clouds.push(new Cloud(Math.random() * width, Math.random() * height));
    }
  }
  update() {
    if (frameCount >= this.lastFrame + this.framesTilCloud) {
      if (clouds.length < 100) {
          let cloudTotal = Math.floor(Math.random() * 1.2 + 1);

          for (let i = 0; i < cloudTotal; i++) {
            clouds.push(new Cloud(-500, Math.random() * windowHeight));
          }
      }
      this.lastFrame = frameCount;
      this.framesTilCloud = this.nextCloudDrop();
    }
  }
  nextCloudDrop() {
      return Math.floor(Math.random() * 60 + 40);
  }
}

function randomWobble() {
  let scale = 1.2;
  return createVector(((Math.random() * 2) - 1) * scale, ((Math.random() * 2) - 1) * scale);
}

function randomReasonableSpeed() {
    let scale = 3;
  return createVector(Math.random() * scale, Math.random() * scale);
}

clouds = [];

function setup() {
  wind = createVector(1); 
  sun = new Sun(windowWidth / 3, windowHeight / 3);
  cloud = new Cloud(windowWidth / 3, windowHeight / 3);
  const myCanvas = createCanvas(windowWidth, windowHeight);
  myCanvas.parent('clouds');

  cloudGen1 = new CloudGenerator();
}

function draw() {
    clear();
    imageMode(CENTER);
    sun.update();
    sun.draw();

    cloudGen1.update();

    let i = clouds.length;

    while (i--) {
        clouds[i].update();
        clouds[i].addWind(wind);
        clouds[i].draw();

        if (clouds[i].isTimeToDie()) {
          clouds.splice(i, 1);
        }

    }
}

