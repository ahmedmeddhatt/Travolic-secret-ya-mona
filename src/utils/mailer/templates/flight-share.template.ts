const shareFlightImage =
  'https://dashboard-api.travolic.com/static/assets/mail.png';
export function shareFlightTemplate(options) {
  return `<!DOCTYPE html
	PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
	<title>Price Alert</title>
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

		.wrapper {
			width: 100%;
			background-color: #f6f9fc;
		}

		.webkit {
			width: 476px;
			height: 512px;
			padding: 40px 40px 40.7px;
			border-radius: 4px;
			box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.16);
			background-color: #ffffff;
		}

		.outer {
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
					<td><img src="${shareFlightImage}" alt="Banner" width="55%"
							style="display: block;	margin-left: auto;	margin-right: auto;"></td>
				</tr>
				<tr>
					<td>
						<div>
							<h1 style="font-family:  'Open Sans', sans-serif;

                                       text-align: center;
                                       margin: 60px 77.5px 18px 85px;
                                       font-size: 22px;
                                       font-weight: bold;
                                       color: #040e29;
                                       line-height: 1.09;
                                       font-stretch: normal;
                                       font-style: normal;
                                       ">
								<strong>Flight Share on Travolic</strong>
							</h1>

							<p style="font-family:  'Open Sans', sans-serif;
                                      text-align: center;
                                      font-size: 16px;
                                      padding-left: 25px;
                                      padding-right: 25px;
                                      color: #040e29;
                                      line-height: 1.5;
                                      margin: 35px 0 40px;
                                      font-weight: normal;
                                      font-style: normal;
                                      font-stretch: normal;
                                      letter-spacing: normal;
                                      height: 40px;
                                      ">
								${options.fullName}  sent you an invitation to view Travolic
								search Result. Email: ${options.from}
							</p>
							<a href="${options.link}" class="cont" style="text-align: center;
                                                                        text-decoration: none;
																		font-size: 16px;
																		font-weight: bold;
                                                                        color: #000000;
                                                                        display: block;
                                                                        width: 170px;
                                                                        background-color: #d6de29;
                                                                        margin-left: auto;
                                                                        margin-right: auto;
                                                                        padding: 13px 10px;
                                                                        margin-top: 40px;
                                                                        border-radius: 4px;
                                                                        font-family:  'Open Sans', sans-serif;
                                                                        ">VIEW</a>

						</div>
					</td>
				</tr>

			</table>
		</div>
	</center>


</body>

</html>`;
}
