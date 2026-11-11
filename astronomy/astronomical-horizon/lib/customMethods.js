// Adding the rotate3D method to the p5.Vector prototype
p5.Vector.prototype.rotate3D = function(angleX, angleY, angleZ) {
    // Rotate around X-axis
    let cosX = Math.cos(angleX);
    let sinX = Math.sin(angleX);
    let y = this.y * cosX - this.z * sinX;
    let z = this.y * sinX + this.z * cosX;
    this.y = y;
    this.z = z;
  
    // Rotate around Y-axis
    let cosY = Math.cos(angleY);
    let sinY = Math.sin(angleY);
    let x = this.x * cosY + this.z * sinY;
    z = this.z * cosY - this.x * sinY;
    this.x = x;
    this.z = z;
  
    // Rotate around Z-axis
    let cosZ = Math.cos(angleZ);
    let sinZ = Math.sin(angleZ);
    x = this.x * cosZ - this.y * sinZ;
    y = this.x * sinZ + this.y * cosZ;
    this.x = x;
    this.y = y;
  
    return this; // Return the vector for chaining
  };