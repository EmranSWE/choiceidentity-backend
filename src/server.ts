import mongoose from 'mongoose';
import app from './app';
import config from './config';
import { errorLogger, logger } from './shared/logger';
import { createServer } from 'http';
// import { initializeSocket } from './app/websocket/SocketServer';
import { sendFirstAdminEmail } from './emails/sendFirstAdminEmail';

async function bootstrap() {
  try {
    await mongoose.connect(config.database_url as string);
    logger.info('💻 Database connected successfully 💻');
     await sendFirstAdminEmail();

    const server = createServer(app);

    // 🔗 Attach Socket.IO to HTTP server
    // initSocket(server);
//   initializeSocket(server);


    server.listen(config.port, () => {
      console.info(`Example app listening on port ${config.port}`);
    });
  } catch (error) {
    errorLogger.error(error);
  }
}

bootstrap();
