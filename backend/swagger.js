
import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Ai Mock Interview API',
    description: 'API Documentation',
  },
  host: `localhost:8082`, 
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['src/index.js']; 

swaggerAutogen()(outputFile, endpointsFiles, doc);
