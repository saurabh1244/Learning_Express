const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Express Learning API',
    description: 'Auto-generated Swagger docs with JWT Bearer auth',
    version: '1.0.0',
  },
  host: 'localhost:3000',
  schemes: ['http'],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste only JWT token. "Bearer" will be added automatically.',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['../index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
