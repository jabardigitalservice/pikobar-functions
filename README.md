# pikobar-functions

[Firebase Cloud Function](https://firebase.google.com/docs/functions) for Pikobar's Firebase project.

## Getting Started

https://firebase.google.com/docs/functions/get-started

## Running Functions Locally

https://firebase.google.com/docs/functions/local-emulator


## Updating Environment Variables

For example, we want to add a key-value pair named `myVar:myValue`.

1. Edit `env.json`, add the key-value pair
```
{
   ..., //other key-value pairs
   "myVar": "myValue"
}
```

2. Unset existing env variables
```bash
firebase functions:config:unset env
```

3. Set the new env variables
```bash
firebase functions:config:set env="$(cat env.json)"
```

4. Use the env variables
```javascript
const value = functions.config().env.myVar; //value contains 'myValue'
```

We can use nested variables. See `updateStatistics` variable in `env.json` for example.
