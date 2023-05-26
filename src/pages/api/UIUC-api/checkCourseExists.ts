import { NextRequest, NextResponse } from 'next/server';
import { has } from '@vercel/edge-config';

export const config = {
  runtime: 'edge',
};

export async function checkExists (courseName: string): Promise<boolean> {
  // get the param "courseName" from the request
  console.log('IN THE CHECKCOURSEEXISTS ---- courseName', courseName)
  const courseExists = await has(courseName)
  console.log('RESULT -- courseExists: ', courseExists)
  return true ? courseExists : false;
};

// To add a value
// 'https://api.vercel.com/v1/edge-config/your_edge_config_id_here/items?teamId=your_team_id_here';