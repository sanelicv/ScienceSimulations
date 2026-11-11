function createMatrix(rows, cols) {
    let matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = new Array(cols).fill(0); // Initializes with zeros
    }
    return matrix;
  }

function matrixMultiply(matrixA, matrixB) {
  // Compatibility check
  if (matrixA[0].length !== matrixB.length) {
    console.error("Incompatible matrices: Columns of A must match rows of B");
    return null;
  }

  let resultMatrix = createMatrix(matrixA.length, matrixB[0].length);

  for (let i = 0; i < resultMatrix.length; i++) {
    for (let j = 0; j < resultMatrix[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < matrixA[0].length; k++) {
        sum += matrixA[i][k] * matrixB[k][j];
      }
      resultMatrix[i][j] = sum;
    }
  }
  return resultMatrix;
}