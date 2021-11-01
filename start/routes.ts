import Route from '@ioc:Adonis/Core/Route'

Route.post('/users', 'UsersController.store')
Route.put('/users/:id', 'UsersController.update')
