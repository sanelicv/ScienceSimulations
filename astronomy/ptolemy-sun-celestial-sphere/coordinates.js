function fixCoord(coord){
    let trueCoord = [0, 0, 0];
    let rotAngle = -PI/2;
    trueCoord[0] = -(coord[0]*cos(rotAngle) + coord[1]*sin(rotAngle));
    trueCoord[1] = -coord[0]*sin(rotAngle) + coord[1]*cos(rotAngle);
    trueCoord[2] = coord[2];
    return trueCoord;
}