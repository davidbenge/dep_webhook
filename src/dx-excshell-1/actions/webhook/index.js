/**
 * This will take in web request and forward it to the socket server
 */

const { Core } = require('@adobe/aio-sdk')
const stateLib = require('@adobe/aio-lib-state')
const { errorResponse, stringParameters, checkMissingRequestInputs } = require('../utils')
const moment = require('moment')
let LEARNER_ID = "learnerX"

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })
  // 'info' is the default level if not set
  logger.info('Calling the webhookin action')

  // Since we are RAW we need to parse the body
  try {
    let cleanBodyBuffer = Buffer.from(params.__ow_body, 'base64')
    cleanBody = cleanBodyBuffer.toString('utf8')
    params.body = cleanBody
  } catch (error) {
    logger.warn(`problem converting body from base64 ${error.message}`)
  }

  //Since we are RAW we need to parse Query params
  try {
    let queryParams = new URLSearchParams(params.__ow_query)
    let queryObject = {}
    for (const [key, value] of queryParams.entries()) {
      queryObject[key] = value
    }
    params.queryParams = queryObject
  }catch(error){
    logger.warn(`problem parsing query params ${error.message}`)
  }

  logger.debug(stringParameters(params))

  try{
    // A web action may elect to interpret and process an incoming HTTP body directly, without the promotion of a JSON object to first class properties available to the action input (e.g., args.name vs parsing args.__ow_query). 
    // When using raw HTTP handling, the __ow_body content will be encoded in Base64 when the request content-type is binary.
    // Parse the body
    // content-type":"application/json"
    switch (params.__ow_headers['content-type']) {
      case 'application/json':
        let cleanBody = {}
        try {
          cleanBody = JSON.parse(params.body)
          params.body = cleanBody
        } catch (error) {
          logger.info(`params.body json error ${error.message}`)
        }
        case 'application/javascript':
          let cleanBodyJs = {}
          try {
            cleanBodyJs = JSON.parse(params.__ow_body)
            params.body = cleanBodyJs
          } catch (error) {
            logger.info(`params.body json error ${error.message}`)
          }
    }

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))
  }catch(error){
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }

  // Handle challenge request
  if (params.body.challenge) {
    let response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        challenge: params.body.challenge
      }
    };
    /*
    response.body = new Buffer(JSON.stringify({
          "challenge": params.challenge
    })).toString('base64');
    */

    return response;
  }else if (params.queryParams.challenge) {
      let response = {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          challenge: params.queryParams.challenge
        }
      };
      /*
      response.body = new Buffer(JSON.stringify({
            "challenge": params.challenge
      })).toString('base64');
      */
  
      return response;
  }else{
    try {  
      // check for missing request input parameters and headers
      const requiredParams = []
      const requiredHeaders = []
      const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
      if (errorMessage) {
        // return and log client errors
        return errorResponse(400, errorMessage, logger)
      }
  
      /*
      if(typeof params.__ow_body == "string"){
        //logger.debug(`params.__ow_body is STRING and we are going to decode it`)
        if((!params.__ow_body.endsWith("}")) || (!params.__ow_body.endsWith("]"))){
          //logger.debug(`params.__ow_body DECODING`)
          let bodyBuffer = Buffer.from(params.__ow_body, 'base64')
          params.__ow_body = bodyBuffer.toString('utf8')
          //logger.debug(`params.__ow_body is now ${params.__ow_body}`)
        }
      }
      */
      
      /****
       * get the paths and use the first one as our key
       */
      if(params.__ow_path && params.__ow_path.length) {
        let parts = params.__ow_path.split('/')
        if(parts.length === 2) {
          LEARNER_ID = decodeURIComponent(parts[1])
        }else{
          const errorMessage = "learner url param (webhook/{learnerX}) is not defined in the request"
          return errorResponse(400, errorMessage, logger)
        }
      }else{
        const errorMessage = "learner url param (webhook/{learnerX}) is not defined in the request"
        return errorResponse(400, errorMessage, logger)
      }
  
      //clean the headers
      let cleanHeaders = Object.assign({}, params.__ow_headers);
      try { delete cleanHeaders["perf-br-req-in"] } catch (error) {}
      try { delete cleanHeaders["via"] } catch (error) {}
      try { delete cleanHeaders["x-azure-clientip"] } catch (error) {}
      try { delete cleanHeaders["x-azure-fdid"] } catch (error) {}
      try { delete cleanHeaders["x-azure-ref"] } catch (error) {}
      try { delete cleanHeaders["x-azure-requestchain"] } catch (error) {}
      try { delete cleanHeaders["x-azure-socketip"] } catch (error) {}
      try { delete cleanHeaders["x-envoy-external-address"] } catch (error) {}
      try { delete cleanHeaders["x-forwarded-for"] } catch (error) {}
      try { delete cleanHeaders["x-forwarded-host"] } catch (error) {}
      try { delete cleanHeaders["x-forwarded-port"] } catch (error) {}
      try { delete cleanHeaders["x-forwarded-proto"] } catch (error) {}
      try { delete cleanHeaders["x-real-ip"] } catch (error) {}
  
      // getting payload body size
      const payloadBodySize = Buffer.byteLength(JSON.stringify(params.body), 'utf8')
  
      let callMessage = {
        'id': moment().unix(),
        'call-time': moment().unix(),
        'call-body-size': payloadBodySize,
        'body': params.body,
        'headers': cleanHeaders,
        'query-params': params.queryParams
      }
     
      //Init the Socket 
      logger.info(`Sending to socket ${params.SOCKET_CLUSTER_ID} ${params.SOCKET_API_KEY} ${LEARNER_ID}`)
      const PieSocket = require("piesocket-nodejs");
      var piesocket = new PieSocket({
        clusterId: params.SOCKET_CLUSTER_ID,
        apiKey: params.SOCKET_API_KEY,
        secret: params.SOCKET_API_SECRET
      });
      
      piesocket.publish(LEARNER_ID, callMessage);
  
      const response = {
        statusCode: 200,
        body: {
          'message': `Successfully handled webhook for ${LEARNER_ID}`,
          'payload-size-bytes': payloadBodySize,
          "echo-message": callMessage
        }
      }
  
      // log the response status code
      //logger.info(`${response.statusCode}: successful request`)
      return response
    } catch (error) {
      // log any server errors
      logger.error(error)
      // return with 500
      return errorResponse(500, 'server error', logger)
    }
  }
}

exports.main = main
