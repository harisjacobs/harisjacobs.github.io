const G = 0.3;
const GroundHeight = 150;
const GroundBounciness = 0.5;
const GroundMu = 0.3;
const CrashSpeed = 16;

const SmokeParticleLifetime = 400;

let smokeParticles = [];

let rocket1;

let cameraPosition;
const cameraSmoothing = 0.1;

const cameraShakeMinimum = 4;
const cameraShakeVelocityMult = 0.03;
let cameraShakeVector;

function setup() {
  createCanvas(windowWidth, windowHeight);
  cameraPosition = new p5.Vector(
    windowWidth / 2,
    windowHeight - GroundHeight * 2
  );
  rocket1 = new Rocket();
}

function draw() {
  let alt = rocket1.position.y * 0.001;
  background(135 + alt, 206 + alt, 235 + alt);

  translate(-cameraPosition.x, -cameraPosition.y);
  
  //Camera shake
  const cameraShakeIntensity = max(0, rocket1.velocity.mag() - cameraShakeMinimum) * cameraShakeVelocityMult;
  cameraShakeVector = createVector(random(-cameraShakeIntensity, cameraShakeIntensity), random(-cameraShakeIntensity, cameraShakeIntensity));
  translate(cameraShakeVector.x, cameraShakeVector.y);

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  BackgroundGrid();
  DrawGround();

  UpdateAndDrawSmoke();

  rocket1.Display();
  rocket1.Update();

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  translate(-cameraShakeVector.x, -cameraShakeVector.y);
  translate(cameraPosition.x, cameraPosition.y);
  const newCameraPosition = new p5.Vector(
    rocket1.position.x - width / 2,
    rocket1.position.y - height / 2
  );
  cameraPosition = p5.Vector.lerp(
    cameraPosition,
    newCameraPosition,
    min(cameraSmoothing * rocket1.velocity.mag() * 0.05, 0.8)
  );
}

function cameraShake() {
  cameraShakeVector = new p5.Vector();
}

function undoCameraShake() {
  translate(-cameraShakeVector.x, -cameraShakeVector.y);
}

function BackgroundGrid() {
  let gridWidth = 100;
  let gridHeight = 100;

  let nlinesX = floor(width / gridWidth) + 1;
  let nlinesY = floor(height / gridHeight) + 1;

  let startX = cameraPosition.x - (cameraPosition.x % gridWidth);
  let startY = cameraPosition.y - (cameraPosition.y % gridHeight);

  for (let nx = 0; nx < nlinesX; nx++) {
    for (let ny = 0; ny < nlinesY; ny++) {
      push();
      stroke(85, 156, 185);
      strokeWeight(6);
      point(startX + nx * gridWidth, startY + ny * gridHeight);
      pop();
    }
  }
}

function DrawGround() {
  push();
  stroke(124, 180, 0);
  strokeWeight(12);
  fill(117, 105, 99);
  rect(cameraPosition.x - 1000, height - GroundHeight, 10000, 10000);
  pop();
}

function UpdateAndDrawSmoke() {
  let newList = [];

  for (let s of smokeParticles) {
    s.Update();
    s.Display();

    if (s.age <= SmokeParticleLifetime) {
      newList.push(s);
    }
  }

  smokeParticles = newList;
}

class Smoke {
  constructor(position, direction, speed) {
    this.age = 0;
    this.position = position;
    this.direction = direction;
    this.speed = speed;
    this.velocity = new p5.Vector(
      sin(this.direction) * this.speed,
      cos(this.direction) * this.speed
    );
    this.decelerationMultiplier = 0.975;
    this.size = random(10, 20);
  }

  Display() {
    push();
    noStroke();
    fill(255 - this.age / 5, 255 - this.age);
    circle(this.position.x, this.position.y, this.size + this.age / 10);
    pop();
  }

  Update() {
    this.age += 2;
    this.position.add(this.velocity);
    this.velocity.mult(this.decelerationMultiplier);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////

    if (this.position.y > height - GroundHeight) {
      this.position = new p5.Vector(this.position.x, height - GroundHeight);
      this.velocity = new p5.Vector(
        this.velocity.x,
        this.velocity.y * -1 * GroundBounciness
      );
    }
  }
}

class Rocket {
  constructor(
    position = new p5.Vector(width / 2, height / 2),
    mass = 10,
    thrust = 3.5,
    torque = 0.01
  ) {
    this.position = position;
    this.velocity = new p5.Vector(0, 0);
    this.rotation = 0;
    this.mass = mass;
    this.maxThrust = thrust;
    this.maxTorque = torque;
    this.crashed = false;
  }

  Display() {
    if (!this.crashed) {
      push();
      translate(this.position.x, this.position.y);
      rotate(this.rotation);
      rectMode(CENTER);
      scale(0.6);
      rect(0, 0, 20, 60);
      triangle(10, -30, -10, -30, 0, -60);
      point(0, 0);
      pop();
    }
  }

  UserInput() {
    let ret = {
      thrust: false,
      torque: 0,
    };

    if (keyIsDown(UP_ARROW)) {
      ret.thrust = true;
    }

    if (keyIsDown(RIGHT_ARROW)) {
      ret.torque += 1;
    }

    if (keyIsDown(LEFT_ARROW)) {
      ret.torque -= 1;
    }
    
    if(keyIsDown(32) && !this.crashed) {
      this.SelfDestruct();
      this.crashed = true;
    }

    return ret;
  }
  
  SelfDestruct() {
    for (let i = 0; i < 15 * this.velocity.mag(); i++) {
      smokeParticles.push(
          new Smoke(
            new p5.Vector(this.position.x, this.position.y),
            -(this.rotation+ random(-0.5, 0.5) +PI) % TWO_PI,
            random(this.velocity.mag())
          )
        );
    }this.crashed = true;

   this.velocity.mult(6);
  }

  Explode() {

    for (let i = 0; i < 15 * this.velocity.mag(); i++) {
      let s = new Smoke(
        new p5.Vector(this.position.x, this.position.y),
        random(-PI, PI),
        random(this.velocity.mag() / 3)
      );
      s.velocity.add(this.velocity.copy().mult(0.1));
      //s.velocity.setMag(sqrt(s.velocity.mag()));
      smokeParticles.push(s);
    }
  }

  Update() {
    if(this.crashed) {
        this.velocity.mult(0.99);
    }

    let resultantForce = new p5.Vector(0, 0);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const control = this.UserInput();

    let rocketThrust = new p5.Vector(0, 0);

    if (control.thrust === true && !this.crashed) {
      rocketThrust.x = sin(this.rotation) * this.maxThrust;
      rocketThrust.y = -cos(this.rotation) * this.maxThrust;

      //Do smoke
      for (let smokeNumber = 0; smokeNumber < 10; smokeNumber++) {
        smokeParticles.push(
          new Smoke(
            new p5.Vector(this.position.x, this.position.y),
            (this.rotation + PI + random(-0.25, 0.25)) % TWO_PI,
            -this.maxThrust
          )
        );
      }
    }

    this.rotation += control.torque * this.maxTorque;

    resultantForce.add(rocketThrust);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //W = mg
    const weightForce = new p5.Vector(0, this.mass * G);
    resultantForce.add(weightForce);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    if (this.position.y > height - GroundHeight) {
      if (this.velocity.mag() > CrashSpeed) {
        this.crashed = true;
        
        this.Explode();
        this.velocity.mult(6);
      }

      this.position = new p5.Vector(this.position.x, height - GroundHeight);
      this.velocity = new p5.Vector(
        this.velocity.x,
        this.velocity.y * -1 * GroundBounciness
      );

      const frictionForce = new p5.Vector(
        (this.velocity.x > 0 ? -1 : 1) * this.mass * G,
        0
      );
      resultantForce.add(frictionForce);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //F = ma => a = F / m
    let acceleration = resultantForce.div(this.mass);

    this.velocity.add(acceleration);
    if (!this.crashed) this.position.add(this.velocity);
  }
}
