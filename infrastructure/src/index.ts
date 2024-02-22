#!/usr/bin/env node
import "source-map-support/register";
import {resolveCurrentUserOwnerName} from "@exanubes/cdk-utils";
import {App, PhysicalName, RemovalPolicy, Stack, Tags} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Distribution, experimental, LambdaEdgeEventType, ViewerProtocolPolicy} from "aws-cdk-lib/aws-cloudfront";
import {S3Origin} from "aws-cdk-lib/aws-cloudfront-origins";
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import {CERTIFICATE_ARN, HOSTED_ZONE_ID} from "./config";
import {ARecord, HostedZone, RecordTarget} from "aws-cdk-lib/aws-route53";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";
import {join} from 'node:path';
import {Code, Runtime} from "aws-cdk-lib/aws-lambda";
import {RetentionDays} from "aws-cdk-lib/aws-logs";

require('dotenv').config()
async function main() {
    const owner = await resolveCurrentUserOwnerName();
    const app = new App();
    const stack = new Stack(app, 'Stack', {});
    const bucket = new Bucket(stack, 'bucket', {
        bucketName: PhysicalName.GENERATE_IF_NEEDED,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'index.html',
        blockPublicAccess: {
            blockPublicAcls: false,
            blockPublicPolicy: false,
            restrictPublicBuckets: false,
            ignorePublicAcls: false
        },
        publicReadAccess: true,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true
    });

    const certificate = Certificate.fromCertificateArn(stack, 'certificate', CERTIFICATE_ARN)

    const edgeLambda = new experimental.EdgeFunction(stack, `correct-html-file-path`, {
        code: Code.fromAsset(join(__dirname, './lambdas/')),
        handler: 'correct-html-file-path.handler',
        runtime: Runtime.NODEJS_LATEST,
        logRetention: RetentionDays.ONE_DAY
    })

    const distribution = new Distribution(stack, 'distribution', {
        certificate,
        defaultRootObject: "index.html",
        domainNames: ["exanub.es"],
        defaultBehavior: {
            origin: new S3Origin(bucket),
            viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            edgeLambdas: [{
                functionVersion: edgeLambda.currentVersion,
                eventType: LambdaEdgeEventType.VIEWER_REQUEST
            }]
        }
    })

    const hostedZone = HostedZone.fromHostedZoneAttributes(stack, 'hosted-zone', {
        hostedZoneId: HOSTED_ZONE_ID,
        zoneName: "exanub.es"
    })

    new ARecord(stack, "alias", {
        zone: hostedZone,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution))
    })

    new BucketDeployment(stack, 'bucket-deployment', {
        sources: [Source.asset(join(__dirname, "../../app/build"))],
        distributionPaths: ['/*'],
        destinationBucket: bucket,
        distribution
    })
    Tags.of(app).add("owner", owner);
}

main().catch((error) => {
    console.log(error);
    process.exit(1);
});