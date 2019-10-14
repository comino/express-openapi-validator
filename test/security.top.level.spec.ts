import * as path from 'path';
import * as express from 'express';
import { expect } from 'chai';
import * as request from 'supertest';
import { createApp } from './common/app';

const packageJson = require('../package.json');

// NOTE/TODO: These tests modify eovConf.securityHandlers
// Thus test execution order matters :-(
describe(packageJson.name, () => {
  let app = null;
  let basePath = null;
  const eovConf = {
    apiSpec: path.join('test', 'resources', 'security.top.level.yaml'),
  };

  before(async () => {
    // Set up the express app
    app = await createApp(eovConf, 3005);
    basePath = app.basePath;

    app.use(
      `${basePath}`,
      express
        .Router()
        .get(`/api_key`, (req, res) => res.json({ logged_in: true }))
        .get(`/api_key_or_anonymous`, (req, res) =>
          res.json({ logged_in: true }),
        )
        .get('/anonymous', (req, res) => res.json({ logged_in: true }))
        .get('/anonymous_2', (req, res) => res.json({ logged_in: true }))
        .get(`/bearer`, (req, res) => res.json({ logged_in: true })),
    );
  });

  after(() => {
    app.server.close();
  });

  it('should inherit top level security and return 401 if apikey header is missing', async () =>
    request(app)
      .get(`${basePath}/api_key`)
      .expect(401)
      .then(r => {
        const body = r.body;
        expect(body.errors).to.be.an('array');
        expect(body.errors).to.have.length(1);
        expect(body.errors[0].message).to.equals(
          "'X-API-Key' header required.",
        );
      }));

  it('should return 200 if apikey or anonymous', async () =>
    request(app)
      .get(`${basePath}/api_key_or_anonymous`)
      .expect(200));

  it('should override api key with bearer and return 401 if bearer is missing', async () =>
    request(app)
      .get(`${basePath}/bearer`)
      .expect(401)
      .then(r => {
        const body = r.body;
        expect(body.errors).to.be.an('array');
        expect(body.errors).to.have.length(1);
        expect(body.errors[0].message).to.equals(
          'Authorization header required.',
        );
      }));

  it('should override api key with bearer and return 200', async () =>
    request(app)
      .get(`${basePath}/bearer`)
      .set('Authorization', 'Bearer XXX')
      .expect(200));

  it('should override api key with anonymous', async () =>
    request(app)
      .get(`${basePath}/anonymous_2`)
      .expect(200));

  it('should override api key with anonymous', async () =>
    request(app)
      .get(`${basePath}/anonymous`)
      .expect(200));
});