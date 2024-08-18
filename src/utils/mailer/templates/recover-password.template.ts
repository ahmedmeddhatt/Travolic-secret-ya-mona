export const recoverPasswordTemplate = (resetLink: string) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link  href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
    <title>Registeration Confirmed</title>
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
        background-color: #f6f9fc;
      }

      table {
        border-spacing: 0;
      }

      td {
        padding: 0;
      }

      img {
        border: 0;
      }

      .wrapper{
        width: 100%;
        background-color: #f6f9fc;
      }

      .webkit{
        width: 375px;
        height: 667px;
        padding: 70px 30px;
        background-color: #ffffff;
      }

      .outer{
        margin: 0 auto;
        width: 100%;
        border-spacing: 0;
      }

    </style>
  </head>
  <body>
       <center class="wrapper">
       <div class="webkit">
         <table class="outer" role="presentation" align="center">
          <tr>
            <td><img src="https://storage.googleapis.com/travolic-bucket/email-images/travolic_logo.png" alt="Banner" class="auth" width="100%" style="display: block;	margin-left: auto;	margin-right: auto;"></td>
          </tr>
          <tr>
            <td>
              <div>
                <h3 style="font-family:  'Open Sans', sans-serif; text-align: center; margin-top: 30px;">Thank you for your registration</h3>
                      <p style="font-family:  'Open Sans', sans-serif; text-align: center; margin-top: 35px; padding-left: 20px ;padding-right: 20px;">
                          This email is sent to you because you wanted to reset your password</p>
                </div>
            </td>
          </tr>
          <tr>
            <td>
              <a href="${resetLink}" class="cont" style="text-align: center; text-decoration: none; color: #000000; display: block;width: 85%;	margin-left: auto;	margin-right: auto;padding-top: 13px;padding-left: 10px; padding-bottom: 13px;padding-right: 10px; margin-top: 10%; background-color: #d6de29;border-radius: 4px; font-family:  'Open Sans', sans-serif;">Reset Password</a>
            </td>
          </tr>
          <tr>
            <td>
              <p style="text-align: center; font-family: 'Open Sans', sans-serif; margin-top: 35px; font-size: 14px;">If you believe you should not get this email  <a   href="#" style="text-decoration: none; color: blue;"> let us know </a></p>
            </td>
          </tr>
         </table>
       </div>
     </center>


  </body>
  </html>`;
};
