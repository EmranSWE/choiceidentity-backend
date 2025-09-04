// modules/features/passwordHealth/passwordHealth.controller.ts
import { RequestHandler } from 'express';
import {  getSecurityScore } from './passwordHealth.service';
import httpStatus from 'http-status';
import catchAsync from '../../../../shared/catchAsync';
import sendResponse from '../../../../shared/sendResponse';

const fetchPasswordScore: RequestHandler = catchAsync(async (req, res) => {
  if (!req.user || !req.user.email) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User not authenticated',
      data: null,
    });
  }
  const userId = req.user.email;

  //   const scoreData = await getPasswordScore(userId);
  const scoreData = await getSecurityScore(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password health score fetched successfully',
    data: scoreData,
  });
});


export  const PasswordController = {
    fetchPasswordScore
}