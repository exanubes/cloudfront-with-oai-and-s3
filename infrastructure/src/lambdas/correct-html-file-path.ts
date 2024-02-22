import {CloudFrontRequestHandler} from "aws-lambda";

export const handler = function correctHtmlFilePath(event, context, callback): void{
    const request = event.Records[0].cf.request
    if(request.uri === "/" ||
    /^\/_app/.test(request.uri) ||
        /\.[a-z]+$/.test(request.uri)
    ){
        return callback(null, request);
    }

    request.uri = `${request.uri}.html`;

    return callback(null, request)
} satisfies CloudFrontRequestHandler