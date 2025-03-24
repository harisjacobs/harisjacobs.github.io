var swarm = [];

const movementSpeed = 2;
const moverSize = 10;

const repelRange = 60;
const repelForce = 0.005;

const attractRange = 170;
const attractForce = 0.0002;

const alignRange = 80;
const alignLerpAmount = 0.25;
const alignForce = 0.008;

const randomNudgeStrength = 0.01;

function setup() {
  createCanvas(800,800);
  
  createRandomBoids(100);
}

function windowResized() {
  //createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(10,15, 30, 60);
  
  UpdateSwarm();
  
  /*
  the twin towers in javascript
  fill(10);
  rect(100, 100, 100, 600);
  rect(300, 100, 100, 600);
  */
}

function mousePressed() {
  swarm.push(new Mover(mouseX, mouseY));
}

function createRandomBoids(amount) {
  for(var i = 0; i < amount; i++) {
    swarm.push(new Mover(random(width), random(height)));
  }
}

function UpdateSwarm() {
  for(var s in swarm) {
    swarm[s].Draw();
    swarm[s].Update(swarm);
  }
}

class Mover {
  constructor(x, y) {
    this.position = new p5.Vector(x, y);
    this.velocity = new p5.Vector(random(-1, 1), random(-1, 1));
    this.velocity = new p5.Vector(-1,-1);
    this.randomNudge = new p5.Vector(random(-1, 1), random(-1, 1));
    //this.randomNudge = new p5.Vector(-1,-1);
  }
  
  Draw() {
    push();
    fill(200, 10, 10);
    stroke(100, 0, 0);
    strokeWeight(1);
    translate(this.position.x, this.position.y);
    rotate(this.velocity.heading());
    triangle(moverSize, 0, -moverSize / 3, - moverSize / 2, -moverSize / 3, moverSize / 2);
    point(0, 0);
    pop();
  }
  
  Update(swarmArray) {
    this.velocity.setMag(movementSpeed);
    this.position.add(this.velocity.mult(50/frameRate()));
    this.position.x = this.position.x < 0 ? width : this.position.x;
    this.position.y = this.position.y < 0 ? height : this.position.y;
    this.position.x = this.position.x > width ? 0 : this.position.x;
    this.position.y = this.position.y > height ? 0 : this.position.y;
    
    this.Steer(swarmArray);
  }
  
  Steer(swarmArray) {
    for(var other of swarmArray) {
      if(other.position != this.position) {
        //dont compute distance to self!
        const d = dist(this.position.x, this.position.y, other.position.x, other.position.y);
        const dPos = this.position.copy().sub(other.position.copy());
        //repulsion
        if(d < repelRange) {
          const repelStrength = (repelRange - d) * repelForce;
          
          const repulsionToApply = dPos.copy().setMag(repelStrength);
          
          this.velocity.add(repulsionToApply.copy().mult(this.velocity.mag() / movementSpeed));
        }
        
        //attraction
        if(d < attractRange) {
          const attractStrength = (attractRange - d) * attractForce;
          const attractionToApply = dPos.copy().setMag(attractStrength);
          
          this.velocity.sub(attractionToApply.copy().mult(this.velocity.mag() / movementSpeed));
        }
        
        //alignment
        if(d < alignRange) {
          const alignStrength = (alignRange - d) * alignForce;
          const myDirection = this.position.copy().setMag(1);
          const otherDirection = other.position.copy().setMag(1);
          const deltaDirection = p5.Vector.lerp(myDirection, otherDirection, alignLerpAmount);
          const alignmentToApply = deltaDirection.setMag(alignForce);
          
          this.velocity.add(alignmentToApply.copy().mult(this.velocity.mag() / movementSpeed));
        }
        var randomVector = new p5.Vector(random(-1, 1), random(-1, 1)).setMag(randomNudgeStrength);
        
        this.randomNudge = p5.Vector.lerp(this.randomNudge, randomVector, 0.1);
        this.velocity.add(this.randomNudge);
      }
    }
  }
}