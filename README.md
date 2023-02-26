# Keleya Skill-Check

## Backend

The task here is to finish the provided 'barebone' backend by implementing all endpoints and required functionality, and setting up the database following these requirements. The goal of this 'project' is to end up with a working REST API with CRUD endpoints for a simple user management, paired with authorization and authentication methods.

For the backend we are using two modern frameworks, [NestJS](https://docs.nestjs.com/) and [Prisma](https://www.prisma.io/docs/getting-started) running on Node 14. To make the database setup as simple as possible, we will use a SQlite DB. One part of this task will thus be, to familiarize yourself with the technology stack.

The repository as provided throws NotImplementedException() for the missing functions, as well as misses the data structures and database.

### Types

Data is being transferred between functions using Data Transfer Objects. This need to be implemented in accordance with the data model. Optionally, data validation should be implemented as well to assure that valid data is being sent into the application.

### Database

The database should follow this schema:
![backend schema](backend_schema.png)

Command lines:

- `npx prisma migrate dev` for migration
- `npx prisma db seed` for seeding

### Endpoints

- GET /user should query for users with these optional filtering parameters:
  - `limit` Limit the number of results returned
  - `offset` Skip the first n results
  - `updatedSince` Return only items which were updated since Date.
  - `id` An Array of id(s) to limit the query to
  - `name` a LIKE search for names
  - `credentials` include the related credentials in result
  - `email` search for matching email
- GET /user/:id should return one specific user with that id
- (public) POST /user should create a new user with credentials
- PATCH /user should update a user if it exists and should update credentials if they exist IF the user has not been deleted previously
- DELETE /user marks the user as deleted and also removes related credentials rows, but does NOT remove the user row itself
- (public) POST /user/authenticate authenticates the user with an email/password combination and returns a boolean
- (public) POST /user/token authenticates the user with an email/password combination and returns a JWT token
- (public) POST /user/validate validates a Bearer token sent via authorization header and returns a boolean

### Security

- Endpoints marked (public) should allow access without authorization
- Endpoints **not** marked (public) should check JWT tokens and map to users
- Health Check endpoints should be public and no JWT should be required
- Non-public endpoints called by Admin users should allow requests to modify all users, while regular users should locked into their own user - they are only allowed to work on their own user id
- Passwords need to be hashed and salted

### Testing

- If possible, unit tests should check the functionality of the various endpoints and services
- Alternatively, discuss why certain tests were not implemented, necessary or useful, or suggest a test environment

### Extra

- Discuss improvements to the data models or endpoints
- Feel free to suggest other solutions to implement similar projects (but for this skill check, do use the given tech stack as provided here)

### How to do the skill check

- Fork this repository
- Make modifications as you see fit
- Add all your notes into this readme
- Send us the link to your fork
- Tell us how long it took you to get the repository to the state you sent us - remember: it's ok to take time if it's done properly.
- Import Hiring Backend Test.postman_collection.json into the latest Postman client and run the collection tests. Depending on how you seed your database, some tests may need to be adjusted for ids. Please take a screenshot of the results like this one:
- ![postman_tests.png](postman_tests.png)
- Send us this screenshot as well as the export of your postman tests.
- the following should run without errors:
```
yarn
npx migrate reset
yarn test
```
### Your Notes Below Here

#### Postman test
![postman](Screen%20Shot%202023-02-26%20at%2013.57.56.png)

**Notes**
- the `Get specific user` endpoint was in the admin folder therefore it had `adminToken`. but its test expected to receive 401 error on accessing userid:2. IDK if it was a misplace or mistake in the test. to fix this issue I moved it to `As User` folder.
- the `Create new user` endpoint can pass the test only the first time, the next time it will raise an exception, in my design email is a unique field.

#### Database design
- the fact that password is saved in another table than the user has following benefits, I didn't change that design though. 
  - (security wise): in future this system can be upgraded in a way to not forbids user use an old password when user forget password.
  - also we can have information about the datetime of last password, in case of data leak, we can inform users to change password, and based on that field we can detect which users still using a leak password and force them or inform them again.
  - I also add a field for email_confirmation to understand if user activate the validate the email entered or not.

#### `Create` Endpoint
- when we delete a user, it is going to be soft delete, and we still keep the information in the user table, this force us to not use unique key on the email field.
- but the system must prevent users to create a new account with already exist email(not deleted).
- no accompished this, when use request for create user, we have to check that this email is not exist(not delete) and then create the user. 
- I use raw sql among with `transaction` in this function to have a single sql command to `check email existence` and `create` the user if it does not already exist. to use transaction in the way that I used, I had to upgrade prisma to `4.8.0`.
- this function can handle concurrency under high load and wont let two request at same time create two users with same email, one will fail.
  