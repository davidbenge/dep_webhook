# Developer Enablement Program

Welcome to Developer Enablement Program helper 
  
## Setup

- Populate the `.env` file in the project root and fill it as shown by the example values needed found in _dot.env
  
    

## Local Dev

- `aio app run` to start your local Dev server
- App will run on `localhost:9080` by default

By default the UI will be served locally but actions will be deployed and served from Adobe I/O Runtime. 
  
  
## Auth Microservice 
The auth micro service is a service that we have created to simplify the process of getting an auth token for use in your training.    

The service when run in Adobe App Builder will be hosted at 
`https://{your_runtime_instance_endpoint/api/v1/web/dx-excshell-1/auth`      
   
The auth service requires the following input parameters 
```
client_id=XXXXX
technical_account_id=XXXXX@techacct.adobe.com
org_id=XXXXX@AdobeOrg
client_secret=XXXXX
private_key=XXXXX
meta_scopes=ent_dataservices_sdk
```

The service supports the option to output a psql for the tenant and sandbox if you pass in these options parameters
```
tenant_name=XXXXX
sandbox_name=XXXXX
```

The results from this micro service call will look like the following if the call was successful 
```JSON
{
    "access_token": "eyJhbGciOiJSUzI....",
    "expires_in": 86399992,
    "psql": "psql 'sslmode=require host=tenant__test_name.platform-query.adobe.io port=80 dbname=my__fake_sandbox_name:all user=3C9419175E9D393C0A495E39@AdobeOrg password=eyJhbGciOiJSUzI....'",
    "token_type": "bearer"
}
```

To use the auth service with postman you can include a Pre-request Script that will set enviroment variables.  

This is an example of a POSTMAN Pre-request Script to set the ACCESS_TOKEN based on the training auth micro service call
```JS
const ERROR_MESSAGE = " not found in active environment. Please ensure the correct environment is selected and populated.";

function getAccessToken() {
    if (!pm.environment.get("IMS_ORG")) {
        throw new Error("IMS_ORG" + ERROR_MESSAGE);
    } else if (!pm.environment.get("TECHNICAL_ACCOUNT_ID")) {
        throw new Error("TECHNICAL_ACCOUNT_ID" + ERROR_MESSAGE);
    } else if (!pm.environment.get("IMS")) {
        throw new Error("IMS" + ERROR_MESSAGE);
    } else if (!pm.environment.get("API_KEY")) {
        throw new Error("API_KEY" + ERROR_MESSAGE);
    } else if (!pm.environment.get("META_SCOPE")) {
        throw new Error("META_SCOPE" + ERROR_MESSAGE);
    } else if (!pm.environment.get("PRIVATE_KEY")) {
        throw new Error("Ensure the Private Key is added to both INITIAL and CURRENT VALUES in the active Postman environment's PRIVATE_KEY variable");
    }

    const loginRequest = {
        url: 'https://27200-373coralcattle-stage.adobeio-static.net/api/v1/web/dx-excshell-1/auth',
        method: 'POST',
        header: 'Content-Type: application/json',
        body: {
             mode: 'urlencoded',
            urlencoded: [
                {key: "client_id", value: pm.environment.get("API_KEY")},
                {key: "technical_account_id", value: pm.environment.get("TECHNICAL_ACCOUNT_ID")},
                {key: "org_id", value: pm.environment.get("IMS_ORG")},
                {key: "client_secret", value: pm.environment.get("CLIENT_SECRET")},
                {key: "private_key", value: pm.environment.get("PRIVATE_KEY")},
                {key: "meta_scopes", value: pm.environment.get("META_SCOPE")},
                {key: "tenant_name", value: pm.environment.get("TENANT_ID")},
                {key: "sandbox_name", value: pm.environment.get("SANDBOX_NAME")}
            ]
        }
    };

    console.log("getting login based on data", loginRequest);

    pm.sendRequest(loginRequest, function (err, response) {
        console.log("call response", response);
        let token = response.json().access_token;
        pm.environment.set("ACCESS_TOKEN", token);
    });
}

getAccessToken();
```
