import { RequestHandler } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';
import { CreditService } from './creditMonitoring.service';

const fetchCreditReport: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user || !req.user.email) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
      data: null,
    });
  }
  const userEmail = req.user.email;


  const reportData = await CreditService.fetchCreditReportService(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Credit report fetched successfully',
    data: reportData,
  });
});

export const CreditController = {
  fetchCreditReport,
};
