let particles = [];
let orbitAngle = 0;
let centerRadius = 40;
let orbiterRadius = 20;
let orbitDistance = 250;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
}

function draw() {
  // Trail effect
  background(0, 0, 0, 15);

  let centerX = width / 2;
  let centerY = height / 2;

  // Calculate orbiting circle position
  let orbitX = centerX + cos(orbitAngle) * orbitDistance;
  let orbitY = centerY + sin(orbitAngle) * orbitDistance;
  orbitAngle += 0.02;

  // Emit particles from the center circle
  // Emit multiple per frame for a denser flow
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(centerX, centerY));
  }

  // Draw Center Circle (Emitter)
  fill(200, 80, 100);
  ellipse(centerX, centerY, centerRadius * 2);
  
  // Optional: Inner glow for center
  fill(200, 40, 100);
  ellipse(centerX, centerY, centerRadius);

  // Update and Draw Particles
  let attractorPos = createVector(orbitX, orbitY);
  
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    // Apply attraction force towards the orbiting circle
    p.attractTo(attractorPos);
    p.update();
    p.display();

    // Check distance to orbiting circle (Absorption)
    let d = dist(p.pos.x, p.pos.y, orbitX, orbitY);
    
    // If particle touches the orbiting circle, it gets absorbed (removed)
    if (d < orbiterRadius + 5) {
      particles.splice(i, 1);
      
      // Visual feedback when absorbed (flash the orbiter slightly)
      noFill();
      stroke(p.hue, 80, 100, 50);
      ellipse(orbitX, orbitY, orbiterRadius * 2.5);
      noStroke();
    } 
    // Remove if it flies off screen or lives too long (cleanup)
    else if (p.isDead()) {
      particles.splice(i, 1);
    }
  }

  // Draw Orbiting Circle (Attractor)
  fill(30, 90, 100);
  ellipse(orbitX, orbitY, orbiterRadius * 2);
  
  // Orbiting circle aura
  fill(30, 90, 100, 30);
  ellipse(orbitX, orbitY, orbiterRadius * 4);
}

class Particle {
  constructor(x, y) {
    this.pos = createVector(x, y);
    // Give random initial velocity to spread them out like a fountain
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 3)); 
    this.acc = createVector(0, 0);
    this.maxSpeed = 10;
    this.lifespan = 255;
    this.hue = random(160, 240); // Blue-ish tones
    this.size = random(3, 6);
  }

  attractTo(target) {
    // Nature of Code: Gravitational Attraction
    // force = G * (m1 * m2) / distance^2
    let force = p5.Vector.sub(target, this.pos);
    let distance = force.mag();
    
    // Constrain distance so particles don't shoot off at infinite speed when very close
    distance = constrain(distance, 5, 25); 
    
    force.normalize();
    
    // Strength of attraction
    let strength = 300 / (distance * distance); 
    force.mult(strength);
    
    this.applyForce(force);
  }

  applyForce(force) {
    // F = A (assuming mass is 1)
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0); // Reset acceleration each frame
    this.lifespan -= 1.0;
  }

  display() {
    // Color changes based on velocity magnitude
    let velocityMag = this.vel.mag();
    let brightness = map(velocityMag, 0, this.maxSpeed, 70, 100);
    
    fill(this.hue, 80, brightness, 80);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return (this.lifespan < 0);
  }
}