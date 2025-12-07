let rods = [];
let systems = [];
let bolts = [];

function setup() {
  createCanvas(800, 600);
  
  // Create rods arranged in a circle
  let radius = 200;
  let numRods = 12;
  for (let i = 0; i < numRods; i++) {
    let angle = map(i, 0, numRods, 0, TWO_PI);
    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;
    rods.push(new Rod(x, y, angle));
  }
}

function draw() {
  background(20);

  // Draw Rods
  for (let r of rods) {
    r.display();
  }

  // Draw and update Lightning Bolts
  for (let i = bolts.length - 1; i >= 0; i--) {
    bolts[i].update();
    bolts[i].display();
    if (bolts[i].isDead()) {
      bolts.splice(i, 1);
    }
  }

  // Draw and update Particle Systems (Sparks)
  for (let i = systems.length - 1; i >= 0; i--) {
    systems[i].run();
    if (systems[i].isDead()) {
      systems.splice(i, 1);
    }
  }
}

function mousePressed() {
  // Find the closest rod to the mouse to act as the target
  let closestDist = Infinity;
  let targetRod = null;

  for (let r of rods) {
    let d = dist(mouseX, mouseY, r.pos.x, r.pos.y);
    if (d < closestDist) {
      closestDist = d;
      targetRod = r;
    }
  }

  if (targetRod) {
    // Create Lightning
    bolts.push(new LightningBolt(createVector(mouseX, mouseY), targetRod.getTip()));
    
    // Create Spark Explosion at the rod's tip
    systems.push(new SparkSystem(targetRod.getTip()));
  }
}

// --- Rod Class ---
class Rod {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.angle = angle; // Angle relative to center
    this.len = 40;
    this.baseWidth = 15;
  }

  // Get the coordinate of the pointy tip
  getTip() {
    // The tip points towards the center.
    // Since pos is at the circle perimeter, we move "inwards" or calculate based on rotation
    // In display, we rotate by angle + PI to point center.
    let tipX = this.pos.x + cos(this.angle + PI) * this.len;
    let tipY = this.pos.y + sin(this.angle + PI) * this.len;
    return createVector(tipX, tipY);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    // Rotate so it points to the center
    // The default triangle points UP. 
    // We want it to point towards center. 
    // The angle calculated in setup is from center OUT to pos.
    // So we rotate by angle + PI (180 deg) to point IN.
    rotate(this.angle + PI + HALF_PI); 
    
    fill(100);
    stroke(150);
    strokeWeight(1);
    
    // Draw a spike/pyramid shape
    beginShape();
    vertex(-this.baseWidth / 2, 0);
    vertex(this.baseWidth / 2, 0);
    vertex(0, -this.len); // Tip
    endShape(CLOSE);
    
    // Draw a small connector base
    fill(80);
    rectMode(CENTER);
    rect(0, 5, this.baseWidth, 10);
    
    pop();
  }
}

// --- Particle System Class (Nature of Code style) ---
class SparkSystem {
  constructor(position) {
    this.origin = position.copy();
    this.particles = [];
    this.lifespan = 255;
    // Create a burst of particles
    for (let i = 0; i < 50; i++) {
      this.particles.push(new Spark(this.origin));
    }
  }

  run() {
    // Systems fade out if needed, but here we check particle emptiness
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.run();
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  isDead() {
    return this.particles.length === 0;
  }
}

// --- Particle Class ---
class Spark {
  constructor(l) {
    this.position = l.copy();
    // Explosive velocity
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(random(2, 10));
    this.acceleration = createVector(0, 0.2); // Gravity
    this.lifespan = 255;
    this.decay = random(10, 20); // Fast decay for "short and intense"
  }

  run() {
    this.update();
    this.display();
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.lifespan -= this.decay;
  }

  display() {
    noStroke();
    // Intense mix of yellow/white/blue
    let r = 255;
    let g = 255;
    let b = random(100, 255);
    
    push();
    // Additive blending makes it look like light
    blendMode(ADD); 
    fill(r, g, b, this.lifespan);
    ellipse(this.position.x, this.position.y, 4, 4);
    pop();
  }

  isDead() {
    return this.lifespan < 0;
  }
}

// --- Lightning Bolt Class ---
class LightningBolt {
  constructor(start, end) {
    this.start = start;
    this.end = end;
    this.segments = [];
    this.life = 10; // Frames visible
    this.generate();
  }

  generate() {
    let current = this.start.copy();
    let target = this.end.copy();
    let distTotal = p5.Vector.dist(current, target);
    let stepSize = 10;
    
    this.segments.push(current.copy());
    
    // Create a jagged path
    let direction = p5.Vector.sub(target, current);
    let steps = distTotal / stepSize;
    direction.div(steps); // step vector

    for (let i = 0; i < steps; i++) {
      current.add(direction);
      
      // Add randomness perpendicular to direction would be ideal, 
      // but simple random jitter works well for chaos
      let jitter = p5.Vector.random2D();
      jitter.mult(random(-15, 15)); 
      
      // Less jitter closer to the target (the rod)
      let progress = i / steps;
      jitter.mult(1 - progress); 

      let nextPoint = p5.Vector.add(current, jitter);
      this.segments.push(nextPoint);
    }
    // Snap last point to exact target
    this.segments.push(target);
  }

  update() {
    this.life--;
  }

  display() {
    if (this.life <= 0) return;

    push();
    stroke(200, 220, 255, map(this.life, 0, 10, 0, 255));
    strokeWeight(2);
    noFill();
    blendMode(ADD);
    
    beginShape();
    for (let v of this.segments) {
      vertex(v.x, v.y);
    }
    endShape();

    // Inner bright core
    stroke(255, 255, 255, map(this.life, 0, 10, 0, 255));
    strokeWeight(1);
    beginShape();
    for (let v of this.segments) {
      vertex(v.x, v.y);
    }
    endShape();
    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}