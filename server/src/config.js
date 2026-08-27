import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Copy server/.env.example to server/.env and fill in your CognoDB Cloud credentials.`
    );
  }
  return value;
}

export const config = {
  cognodb: {
    uri: required('COGNODB_URI'),
    user: required('COGNODB_USER'),
    password: required('COGNODB_PASSWORD'),
  },
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};
