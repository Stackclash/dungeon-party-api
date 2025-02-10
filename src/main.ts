import { INestApplication, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { Request } from 'express'

import { AppModule } from './app.module'

function bootstrapSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Dungeon Party API')
    .setDescription('API for Dungeon Party')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
      },
      'api-key',
    )
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup(':version/docs', app, documentFactory, {
    useGlobalPrefix: true,
    jsonDocumentUrl: ':version/docs/json',
    patchDocumentOnRequest: (req, _res, document) => {
      // NOTE: Make a deep copy of the original document or it will be modified on subsequent calls!
      const copyDocument: OpenAPIObject = { ...document }
      const version = (req as Request).params.version
      const isValidVersion = /^v[0-9]+$/

      if (version && isValidVersion.test(version)) {
        copyDocument.info.version = version

        for (const route in document.paths) {
          if (!route.includes(`/${version}/`)) {
            delete copyDocument.paths[route]
          }
        }
      }

      return copyDocument
    },
  })
}

function bootstrap(app: INestApplication) {
  // Setup global prefix
  app.setGlobalPrefix('api')

  // Setup versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  bootstrapSwagger(app)
}

async function start() {
  const app = await NestFactory.create(AppModule)

  bootstrap(app)

  await app.listen(process.env.PORT ?? 3000)
}
start()
