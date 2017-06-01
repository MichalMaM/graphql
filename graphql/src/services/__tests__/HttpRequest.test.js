// @flow

import request, { post } from '../HttpRequest';
import { ProxiedError } from '../errors/ProxiedError';

jest.mock('node-fetch');

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  process.env.NODE_ENV = 'production';
});

afterEach(() => {
  jest.resetAllMocks();
  process.env.NODE_ENV = 'test';
});

describe('GET request', () => {
  it('should throw exception in test environment', async () => {
    process.env.NODE_ENV = 'test';
    await expect(request('https://path/to/api')).rejects.toEqual(
      new Error('HttpRequest should never be called in test environment.'),
    );
  });
});

describe('GET request in production', () => {
  it('resolves URL with token', async () => {
    expect(await request('https://path/to/api', 't/ok"en')).toMatchSnapshot();
  });

  it('resolves URL without token', async () => {
    expect(await request('https://path/to/api')).toMatchSnapshot();
  });

  it('throws exception during invalid return status code', async () => {
    expect.assertions(4);

    try {
      await request('https://path/to/api?status=500');
    } catch (error) {
      expect(error).toBeInstanceOf(ProxiedError);
      expect(error).toHaveProperty('message', 'Status Text');
      expect(error).toHaveProperty('originStatusCode', 500);
      expect(error).toHaveProperty(
        'originUrl',
        'https://path/to/api?status=500',
      );
    }
  });
});

describe('POST request', () => {
  it('should throw exception in test environment', async () => {
    process.env.NODE_ENV = 'test';
    await expect(post('https://path/to/api', {})).rejects.toEqual(
      new Error('HttpRequest should never be called in test environment.'),
    );
  });
});

describe('POST request in production', () => {
  it('throws exception during invalid return status code', async () => {
    expect.assertions(4);

    try {
      await post('https://path/to/api?status=500', {});
    } catch (error) {
      expect(error).toBeInstanceOf(ProxiedError);
      expect(error).toHaveProperty('message', 'Status Text');
      expect(error).toHaveProperty('originStatusCode', 500);
      expect(error).toHaveProperty(
        'originUrl',
        'https://path/to/api?status=500',
      );
    }
  });

  it('adds default content type header', async () => {
    expect(await post('https://path/to/api', {})).toMatchSnapshot();
  });

  it('supports custom content type header', async () => {
    expect(
      await post(
        'https://path/to/api',
        {},
        { 'Content-Type': 'application/soap+xml' },
      ),
    ).toMatchSnapshot();
  });

  it('supports custom headers', async () => {
    expect(
      await post(
        'https://path/to/api',
        {},
        {
          'Content-Type': 'application/soap+xml',
          'X-Custom-A': 'Value A',
          'X-Custom-B': 'Value B',
        },
      ),
    ).toMatchSnapshot();
  });

  it('stringify payload', async () => {
    expect(
      await post('https://path/to/api', {
        email: 'john@example.com',
        password: 123456,
      }),
    ).toMatchSnapshot();
  });
});
