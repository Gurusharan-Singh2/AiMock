
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'RoomSathi API',
    description: 'API Documentation',
  },
  host: `localhost:8082`, 
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['src/index.js']; 

swaggerAutogen()(outputFile, endpointsFiles, doc);
