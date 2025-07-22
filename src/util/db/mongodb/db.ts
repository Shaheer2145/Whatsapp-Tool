//import mongoose from 'mongoose';
import config from '../../../config';

const mongoose =
  config.tokenStoreType === 'mongodb' ? require('mongoose') : null;

if (config.tokenStoreType === 'mongodb') {
  mongoose.Promise = global.Promise;

  if (!config.db.mongoIsRemote) {
    mongoose
      .connect(
        `mongodb+srv://arsalan:arsalan@cluster0.gwzj5.mongodb.net/whatsapp?retryWrites=true&w=majority`,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }
      )
      .then(() => console.log('MongoDB (Local) connected successfully'))
      .catch((err: any) => console.error('Mongodb connection error ', err));
  } else {
    mongoose
      .connect(config.db.mongoURLRemote, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => console.log('DB connected to Atlas'))
      .catch((err) => console.error('Error', err));
  }
}

export default mongoose;
