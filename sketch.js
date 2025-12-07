let attractor;
let movers = [];
let particles = [];

function setup() {
  createCanvas(800, 600);
  attractor = new Attractor(width / 2, height / 2);
  
  // Initial batch of movers
  for (let i = 0; i < 5; i++) {
    spawnMover();
  }
}

function draw() {
  background(20, 20, 30); // Dark background

  // Randomly spawn new movers to keep the simulation going
  if (random(1) < 0.02) {
    spawnMover();
  }

  // Update and display Attractor
  attractor.display();

  // Update and display Movers (Small objects)
  for (let i = movers.length - 1; i >= 0; i--) {
    let m = movers[i];
    
    // Slight attraction to center so they eventually get eaten
    let force = attractor.calculateAttraction(m);
    force.mult(0.1); // Weak pull for whole objects
    m.applyForce(force);
    
    m.update();
    m.display();

    // Check collision with Attractor
    if (attractor.checkCollision(m)) {
      // Create explosion of particles
      shatter(m);
      movers.splice(i, 1);
    }
  }

  // Update and display Particles (Broken bits)
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Strong attraction to center
    let force = attractor.calculateAttraction(p);
    force.mult(2.5); // Strong pull for particles
    p.applyForce(force);
    
    p.update();
    p.display();
    
    // Remove if sucked into the center core or too old
    let d = dist(p.pos.x, p.pos.y, attractor.pos.x, attractor.pos.y);
    if (d < 5 || p.isDead()) {
      particles.splice(i, 1);
    }
  }
}

function spawnMover() {
  // Spawn from edges
  let x, y;
  if (random(1) < 0.5) {
    x = random(1) < 0.5 ? -20 : width + 20;
    y = random(height);
  } else {
    x = random(width);
    y = random(1) < 0.5 ? -20 : height + 20;
  }
  movers.push(new Mover(x, y, random(10, 25)));
}

function shatter(mover) {
  // Number of particles based on size
  let count = floor(mover.mass * 10); 
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(mover.pos.x, mover.pos.y, mover.color));
  }
}

// ---------------------------------------------------------
// Classes
// ---------------------------------------------------------

class Attractor {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.mass = 50;
    this.r = 40;
    this.pulse = 0;
  }

  calculateAttraction(mover) {
    let force = p5.Vector.sub(this.pos, mover.pos);
    let distance = force.mag();
    distance = constrain(distance, 5, 250); // Constrain distance
    force.normalize();

    // F = (G * m1 * m2) / d^2
    let strength = (1.5 * this.mass * mover.mass) / (distance * distance);
    force.mult(strength);
    return force;
  }

  checkCollision(mover) {
    let d = dist(this.pos.x, this.pos.y, mover.pos.x, mover.pos.y);
    // Collision happens when the mover touches the event horizon
    return d < (this.r/2 + mover.r);
  }

  display() {
    noStroke();
    
    // Glow effect
    for(let i = 0; i < 5; i++) {
      fill(255, 100, 100, 20 - i*4);
      circle(this.pos.x, this.pos.y, this.r * 2 + i * 20 + sin(frameCount * 0.1) * 10);
    }

    // Core
    fill(20, 0, 0);
    stroke(255, 50, 50);
    strokeWeight(2);
    circle(this.pos.x, this.pos.y, this.r);
  }
}

class Mover {
  constructor(x, y, r) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 3)); // Initial random velocity
    this.acc = createVector(0, 0);
    this.r = r;
    this.mass = r / 2; // Mass tied to size
    this.color = color(random(100, 200), random(100, 255), 255);
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Add some drag so they don't accelerate infinitely
    this.vel.mult(0.99);
  }

  display() {
    noStroke();
    fill(this.color);
    circle(this.pos.x, this.pos.y, this.r * 2);
    
    // Shine
    fill(255, 100);
    circle(this.pos.x - this.r*0.3, this.pos.y - this.r*0.3, this.r * 0.5);
  }
}

class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    // Explosion force: random direction outward
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(2, 8)); 
    this.acc = createVector(0, 0);
    this.mass = 1; // Particles are light
    this.lifespan = 255;
    this.col = col;
    this.prevPos = this.pos.copy();
  }

  applyForce(force) {
    let f = force.copy(); // Particles ignore mass (f=a) for chaotic effect
    this.acc.add(f);
  }

  update() {
    this.prevPos = this.pos.copy();
    
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Friction/Drag (Simulating atmosphere or resistance so suction wins)
    this.vel.mult(0.92); 
    
    this.lifespan -= 1.5;
  }

  isDead() {
    return this.lifespan < 0;
  }

  display() {
    stroke(red(this.col), green(this.col), blue(this.col), this.lifespan);
    strokeWeight(2);
    // Draw line from previous position to create a streak effect
    line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
  }
}