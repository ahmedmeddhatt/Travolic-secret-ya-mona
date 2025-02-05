import { Image } from '../../../models';
import currencyConverter from '../../../middlewares/currencyConverter';

`https://travolic.com/flights/search/CAI-LHR/2020-12-09/LHR-CAI/2020-12-16?adults=1&cabinClass=Economy&children=0&infants=0`;
`PRG-202012101135-PS-1-LGW-202012111125`;
export const priceAlertTemplate = async (
  origin: any,
  destination: any,
  price: number,
  currency: string,
  trends: any
): Promise<string> => {
  const url = `${process.env.GCLOUD_STORAGE_PUBLIC_URL}/${process.env.GCLOUD_STORAGE_BUCKET}`;
  let tableContent = '';
  const convertCurrency = await currencyConverter(currency);
  if (trends.length === 0) {
    tableContent = 'No data';
  }
  for (let i = 0; i < trends.length; i++) {
    const image = await Image.findOne({
      filename: trends[i].destinationCode
    });

    let imageURL = ``;

    if (!image) {
      imageURL = `${url}/default_trending.jpeg`;
    } else {
      imageURL = `${url}/${image.pathWithFilename}`;
    }

    tableContent += `<table cellpadding="0" cellspacing="0" class="es-right" align="right" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;float:right">
      <tr>
       <td align="center" style="padding:0;Margin:0;width:200px">
        <table cellpadding="0" cellspacing="0" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:separate;border-spacing:0px;border-left:1px solid #efefef;border-right:1px solid #efefef;border-top:1px solid #efefef;border-bottom:1px solid #efefef;border-radius:5px" role="presentation">
          <tr>
           <td align="center" style="padding:5px;Margin:0;font-size:0px"><img src="${imageURL}" alt style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic" width="161"></td>
          </tr>
          <tr>
           <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-left:10px;padding-right:10px"><h3 style="Margin:0;line-height:24px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:20px;font-style:normal;font-weight:bold;color:#333333">${
             trends[i].phrase
           }</h3></td>
          </tr>
          <tr>
           <td align="center" style="padding:0;Margin:0;padding-top:5px;padding-left:10px;padding-right:10px"><p style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">${
             trends[i].destinationName
           }</p></td>
          </tr>
          <tr>
           <td align="center" class="es-m-txt-c" style="Margin:0;padding-top:5px;padding-bottom:5px;padding-left:10px;padding-right:10px"><h2 style="Margin:0;line-height:31px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:26px;font-style:normal;font-weight:bold;color:#333333"><strong>${convertCurrency(
             trends[i].oneWayPrice.minPrice.amount,
             currency
           ).toFixed(
             2
           )}&nbsp;</strong><span style="font-size:14px">${currency}</span><span style="color:#999999"><s style="text-decoration:line-through"></s></span></h2></td>
          </tr>
          <tr>
           <td align="center" style="padding:0;Margin:0;padding-left:5px;padding-right:5px;padding-bottom:20px"><span class="es-button-border" style="border-style:solid;border-color:#5c68e2;background:#ffffff;border-width:2px;display:inline-block;border-radius:5px;width:auto"><a href="" class="es-button es-button-1" target="_blank" style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#5c68e2;font-size:20px;border-style:solid;border-color:#ffffff;border-width:5px 30px;display:inline-block;background:#ffffff;border-radius:5px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center">Book Now</a></span></td>
          </tr>
        </table></td>
      </tr>
    </table>`;
  }
  const res = `
  <!DOCTYPE html
  PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="font-family:arial, 'helvetica neue', helvetica, sans-serif">

<head>
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Travolic Price Alert: ${origin.code} - ${destination.code}</title>
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    [data-ogsb] .es-button {
      border-width: 0 !important;
      padding: 10px 30px 10px 30px !important;
    }

    [data-ogsb] .es-button.es-button-1 {
      padding: 5px 30px !important;
    }

    @media only screen and (max-width:600px) {

      p,
      ul li,
      ol li,
      a {
        line-height: 150% !important
      }

      h1,
      h2,
      h3,
      h1 a,
      h2 a,
      h3 a {
        line-height: 120%
      }

      h1 {
        font-size: 36px !important;
        text-align: left
      }

      h2 {
        font-size: 26px !important;
        text-align: left
      }

      h3 {
        font-size: 20px !important;
        text-align: left
      }

      .es-header-body h1 a,
      .es-content-body h1 a,
      .es-footer-body h1 a {
        font-size: 36px !important;
        text-align: left
      }

      .es-header-body h2 a,
      .es-content-body h2 a,
      .es-footer-body h2 a {
        font-size: 26px !important;
        text-align: left
      }

      .es-header-body h3 a,
      .es-content-body h3 a,
      .es-footer-body h3 a {
        font-size: 20px !important;
        text-align: left
      }

      .es-menu td a {
        font-size: 12px !important
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 14px !important
      }

      .es-content-body p,
      .es-content-body ul li,
      .es-content-body ol li,
      .es-content-body a {
        font-size: 16px !important
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 14px !important
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important
      }

      *[class="gmail-fix"] {
        display: none !important
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important
      }

      .es-button-border {
        display: inline-block !important
      }

      a.es-button,
      button.es-button {
        font-size: 20px !important;
        display: inline-block !important
      }

      .es-adaptive table,
      .es-left,
      .es-right {
        width: 100% !important
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important
      }

      .es-m-p0 {
        padding: 0 !important
      }

      .es-m-p0r {
        padding-right: 0 !important
      }

      .es-m-p0l {
        padding-left: 0 !important
      }

      .es-m-p0t {
        padding-top: 0 !important
      }

      .es-m-p0b {
        padding-bottom: 0 !important
      }

      .es-m-p20b {
        padding-bottom: 20px !important
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important
      }

      tr.es-desk-hidden {
        display: table-row !important
      }

      table.es-desk-hidden {
        display: table !important
      }

      td.es-desk-menu-hidden {
        display: table-cell !important
      }

      .es-menu td {
        width: 1% !important
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important
      }

      table.es-social {
        display: inline-block !important
      }

      table.es-social td {
        display: inline-block !important
      }

      .es-m-p5 {
        padding: 5px !important
      }

      .es-m-p5t {
        padding-top: 5px !important
      }

      .es-m-p5b {
        padding-bottom: 5px !important
      }

      .es-m-p5r {
        padding-right: 5px !important
      }

      .es-m-p5l {
        padding-left: 5px !important
      }

      .es-m-p10 {
        padding: 10px !important
      }

      .es-m-p10t {
        padding-top: 10px !important
      }

      .es-m-p10b {
        padding-bottom: 10px !important
      }

      .es-m-p10r {
        padding-right: 10px !important
      }

      .es-m-p10l {
        padding-left: 10px !important
      }

      .es-m-p15 {
        padding: 15px !important
      }

      .es-m-p15t {
        padding-top: 15px !important
      }

      .es-m-p15b {
        padding-bottom: 15px !important
      }

      .es-m-p15r {
        padding-right: 15px !important
      }

      .es-m-p15l {
        padding-left: 15px !important
      }

      .es-m-p20 {
        padding: 20px !important
      }

      .es-m-p20t {
        padding-top: 20px !important
      }

      .es-m-p20r {
        padding-right: 20px !important
      }

      .es-m-p20l {
        padding-left: 20px !important
      }

      .es-m-p25 {
        padding: 25px !important
      }

      .es-m-p25t {
        padding-top: 25px !important
      }

      .es-m-p25b {
        padding-bottom: 25px !important
      }

      .es-m-p25r {
        padding-right: 25px !important
      }

      .es-m-p25l {
        padding-left: 25px !important
      }

      .es-m-p30 {
        padding: 30px !important
      }

      .es-m-p30t {
        padding-top: 30px !important
      }

      .es-m-p30b {
        padding-bottom: 30px !important
      }

      .es-m-p30r {
        padding-right: 30px !important
      }

      .es-m-p30l {
        padding-left: 30px !important
      }

      .es-m-p35 {
        padding: 35px !important
      }

      .es-m-p35t {
        padding-top: 35px !important
      }

      .es-m-p35b {
        padding-bottom: 35px !important
      }

      .es-m-p35r {
        padding-right: 35px !important
      }

      .es-m-p35l {
        padding-left: 35px !important
      }

      .es-m-p40 {
        padding: 40px !important
      }

      .es-m-p40t {
        padding-top: 40px !important
      }

      .es-m-p40b {
        padding-bottom: 40px !important
      }

      .es-m-p40r {
        padding-right: 40px !important
      }

      .es-m-p40l {
        padding-left: 40px !important
      }

      .es-desk-hidden {
        display: table-row !important;
        width: auto !important;
        overflow: visible !important;
        max-height: inherit !important
      }
    }

  </style>
</head>

<body data-new-gr-c-s-loaded="14.1070.0"
  style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div class="es-wrapper-color" style="background-color:#FAFAFA">
    <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#fafafa"></v:fill>
			</v:background>
		<![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0"
      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top;background-color:#FAFAFA">
      <tr>
        <td valign="top" style="padding:0;Margin:0">
          <table cellpadding="0" cellspacing="0" class="es-content" align="center"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr>
              <td class="es-info-area" align="center" style="padding:0;Margin:0">
                <table class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"
                  bgcolor="#FFFFFF">
                  <tr>
                    <td align="left" style="padding:20px;Margin:0">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                          <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center" class="es-infoblock"
                                  style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px">
                                    <a target="_blank" href=""
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px">View
                                      online version</a></p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-header" align="center"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" class="es-header-body" align="center" cellpadding="0" cellspacing="0"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px">
                  <tr>
                    <td align="left"
                      style="Margin:0;padding-top:10px;padding-bottom:10px;padding-left:20px;padding-right:20px">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                          <td class="es-m-p0r" valign="top" align="center" style="padding:0;Margin:0;width:560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center" style="padding:0;Margin:0;padding-bottom:20px;font-size:0px"><img
                                    src="https://storage.googleapis.com/travolic-bucket/price-alert-images/travolic_logo.png" alt="Logo"
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;font-size:12px"
                                    width="200" title="Logo"></td>
                              </tr>
                              <tr>
                                <td align="center" class="es-m-txt-c"
                                  style="padding:0;Margin:0;padding-bottom:10px;display: flex;justify-content: center">
                                  <img src="https://storage.googleapis.com/travolic-bucket/price-alert-images/travolic_BILL.png" alt="Logo"
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;font-size:12px"
                                    width="60" title="Logo"></p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:70px;color:#000080;font-size:32px">
                                    <strong>PRICE ALERT</strong>
                                </td>

                              </tr>

                              <tr>
                                <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:10px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:70px;color:#000080;font-size:32px">
                                    <strong></strong></p>
                                  <h3
                                    style="Margin:0;line-height:37px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:25px;font-style:normal;font-weight:bold;color:#333333">
                                    We are the traveler’s best guide<br> to the best deal</h3>
                                  <h3
                                    style="Margin:0;line-height:37px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:14px;font-style:normal;font-weight:bold;color:#333333;padding-top: 10px">
                                    Here is the latest price for flights from <span style=" color:#000080"> ${
                                      origin.name
                                    }
                                    </span> to <span style="color:#000080"> ${
                                      destination.name
                                    } </span></h3>
                                </td>
                              </tr>

                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  <tr>
                    <td class="es-m-p20t" align="left"
                      style="padding:0;Margin:0;padding-left:20px;padding-right:20px;padding-top:30px">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                          <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center" style="padding:0;Margin:0;font-size:0px"><img class="adapt-img"
                                    src="${
                                      destination.city.image
                                        ? `${url}/${destination.city.image.pathWithFilename}`
                                        : `${url}/default_trending.jpeg`
                                    }" alt
                                    style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                    width="560"></td>
                              </tr>
                              <tr>
                                <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-bottom:10px; padding-top: 20px">
                                  <h1
                                    style="Margin:0;line-height:46px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:46px;font-style:normal;font-weight:bold;color:#333333">
                                    <strong>${convertCurrency(
                                      price,
                                      currency
                                    ).toFixed(2)} ${currency}</strong></h1>
                                </td>
                              </tr>

                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                  <tr>
                    <td align="left" style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <td align="center" style="padding:0;Margin:0;padding-bottom:10px"><span class="es-button-border"
                            style="border-style:solid;border-color:#2CB543;background:#d6de29;border-width:0px;display:inline-block;border-radius:6px;width:auto"><a
                              href="" class="es-button" target="_blank"
                              style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;color:#040e29;font-size:20px;border-style:solid;border-color:#d6de29;border-width:10px 30px 10px 30px;display:inline-block;background:#d6de29;border-radius:6px;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center;border-left-width:30px;border-right-width:30px">
                              View Deal </a></span></td>

                        <tr>
                          <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center" class="es-m-txt-c" style="padding:0;Margin:0;padding-top:10px;">
                                  <h2
                                    style="Margin:0;line-height:31px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:26px;font-style:normal;font-weight:bold;color:#333333">
                                    Trending Destinations from <span style="color:#000080">${
                                      origin.city.name
                                    }</span></h2>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>

                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="left"
                      style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:0;padding-right:0; text-align:center; width: 600px">
                        ${tableContent}
                      </td>
                  </tr>
                  <tr>
                    <td align="left"
                      style="padding:0;Margin:0;padding-bottom:20px;padding-left:20px;padding-right:20px">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                          <td align="left" style="padding:0;Margin:0;width:560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center" style="padding:0;Margin:0">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333;font-size:14px">
                                    You have the option of turning off notifications for these dates. <a href='@'
                                      style="color:black;font-size: 12px;text-decoration:underline;"> <span
                                        style="color:black;font-size: 12px;text-decoration:none;list-style: none"><br>
                                        turn off notifications</span></a>
                                  </p>
                              </tr>



                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-footer" align="center"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%;background-color:transparent;background-repeat:repeat;background-position:center top">
            <tr>
              <td align="center" style="padding:0;Margin:0">
                <table class="es-footer-body" align="center" cellpadding="0" cellspacing="0"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:640px">
                  <tr>
                    <td align="left"
                      style="Margin:0;padding-top:20px;padding-bottom:20px;padding-left:20px;padding-right:20px">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                          <td align="left" style="padding:0;Margin:0;width:600px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center"
                                  style="padding:0;Margin:0;padding-top:15px;padding-bottom:15px;font-size:0">
                                  <table cellpadding="0" cellspacing="0" class="es-table-not-adapt es-social"
                                    role="presentation"
                                    style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                    <tr>
                                      <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><img
                                          title="Facebook" src="https://storage.googleapis.com/travolic-bucket/price-alert-images/facebook-logo-black.png" alt="Fb" width="32"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </td>
                                      <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><img
                                          title="Twitter" src="https://storage.googleapis.com/travolic-bucket/price-alert-images/twitter-logo-black.png" alt="Tw" width="32"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </td>
                                      <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><img
                                          title="Instagram" src="https://storage.googleapis.com/travolic-bucket/price-alert-images/instagram-logo-black.png" alt="Inst" width="32"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </td>
                                      <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><img
                                          title="Youtube" src="https://storage.googleapis.com/travolic-bucket/price-alert-images/youtube-logo-black.png" alt="Yt" width="32"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </td>
                                      <td align="center" valign="top" style="padding:0;Margin:0;padding-right:40px"><img
                                          title="Pinterest" src="https://storage.googleapis.com/travolic-bucket/price-alert-images/pinterest-logo-black.png" alt="P" width="32"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </td>
                                      <td align="center" valign="top" style="padding:0;Margin:0"><img title="Linkedin"
                                          src="https://storage.googleapis.com/travolic-bucket/price-alert-images/linkedin-logo-black.png" alt="In" width="32"
                                          style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic">
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="padding:0;Margin:0;padding-bottom:35px">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">
                                  </p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">
                                    Travolic ©2022 All Rights Reserved.</p>
                                  <h1
                                    style="Margin:0;line-height:55px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:46px;font-style:normal;font-weight:bold;color:#333333">
                                    <strong><a target="_blank" href=""
                                        style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#333333;font-size:46px"></a></strong>
                                  </h1>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">
                                    You can unsubscribe at any time by clicking on the “unsubscribe” link at the end of
                                    each email.</p>
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:18px;color:#333333;font-size:12px">
                                    <br></p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" class="es-content" align="center"
            style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
            <tr>
              <td class="es-info-area" align="center" style="padding:0;Margin:0">
                <table class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                  style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:transparent;width:600px"
                  bgcolor="#FFFFFF">
                  <tr>
                    <td align="left" style="padding:20px;Margin:0">
                      <table cellpadding="0" cellspacing="0" width="100%"
                        style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                        <tr>
                          <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tr>
                                <td align="center" class="es-infoblock"
                                  style="padding:0;Margin:0;line-height:14px;font-size:12px;color:#CCCCCC">
                                  <p
                                    style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:14px;color:#CCCCCC;font-size:12px">
                                    <a target="_blank" href=""
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a>No
                                    longer want to receive these emails?&nbsp;<a href="" target="_blank"
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px">Unsubscribe</a>.<a
                                      target="_blank" href=""
                                      style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;text-decoration:underline;color:#CCCCCC;font-size:12px"></a>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>

</html>
`;
  return res;
};
