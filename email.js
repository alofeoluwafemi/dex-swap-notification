const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const { ethers } = require("ethers");
const { utils } = ethers;
require("dotenv").config();

const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_PRIVATE_KEY
});

const sendEmail = async (data) => {
  const htmlMsg = `<table border="1" cellpadding="1" cellspacing="1" style="width:100%;background-color:green;border-collapse:collapse;color:#ffffff;border:1px solid #ffffff">
	<tbody>
		<tr>
			<td><strong>Transaction Type</strong></td>
			<td>${data.transactionType}</td>
		</tr>
		<tr>
			<td><strong>MContent Token Value</strong></td>
			<td>${data.tokenValue}</td>
		</tr>
		<tr>
			<td><b>BNB Token Value</b></td>
			<td>${utils.formatEther(data.bnbValue)}</td>
		</tr>
		<tr>
			<td><strong>Address</strong></td>
			<td>${data.from}</td>
		</tr>
		<tr>
			<td><strong>View on explorer&nbsp;</strong><span style="color: rgb(32, 33, 36); font-family: arial, sans-serif; font-size: 16px;">🔗</span></td>
			<td>
                <a href="https://bscscan.com/tx/${data.hash}">${data.hash}</a>
            </td>
		</tr>
	</tbody>
</table>`;

  //   console.log(htmlMsg);
  mg.messages
    .create(process.env.MAILGUN_DOMAIN, {
      from: "MContent Watch 👀 <info@decasoft.io>",
      to: ["oluwafemialofe@gmail.com"],
      subject: `Pancake V2 MContent Token Swap | ${data.transactionType}`,
      html: htmlMsg
    })
    .then((msg) => console.log(msg)) // logs response data
    .catch((err) => console.error(err)); // logs any error
};

exports.sendEmail = sendEmail;
