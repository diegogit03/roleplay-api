import test from 'japa';
import supertest from 'supertest';

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`;

test.group('Users', () => {
	test.only('it should create an user', async assert => {
		const userPayload = {
			email: 'test@test.com',
			username: 'test',
			password: 'test',
      avatar: 'https://picsum.photos/200'
		}

		const { body } = await supertest(BASE_URL)
			.post('/users')
			.send(userPayload)
			.expect(201)

    assert.exists(body.id, 'Id undefined')
    assert.equal(body.email, userPayload.email)
    assert.equal(body.username, userPayload.username)
    assert.equal(body.avatar, userPayload.avatar)
    assert.notExists(body.password, 'Password defined')
	});
});
