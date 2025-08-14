import { User } from "../app/modules/auth/auth.model";
import { UserService } from "../app/modules/auth/auth.service";

export const sendFirstAdminEmail = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await UserService.AdminRequestSetup(process.env.ADMIN_EMAIL!);
    }
  } catch (err) {
    console.error('Failed to send first admin email:', err);
  }
};


