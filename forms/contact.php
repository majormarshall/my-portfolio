<?php
  /**
   * Contact Form Handler
   * Portfolio: Bello Abdulwadud Ayomide
   * Uses PHP Email Form library from BootstrapMade
   */

  // Your receiving email address
  $receiving_email_address = 'kalibest10@gmail.com';

  if( file_exists($php_email_form = '../assets/vendor/php-email-form/php-email-form.php' )) {
    include( $php_email_form );
  } else {
    die( 'Unable to load the PHP Email Form Library. Please upload it to: assets/vendor/php-email-form/php-email-form.php');
  }

  $contact = new PHP_Email_Form;
  $contact->ajax = true;

  $contact->to = $receiving_email_address;
  $contact->from_name = $_POST['name'];
  $contact->from_email = $_POST['email'];
  $contact->subject = '[Portfolio Enquiry] ' . $_POST['subject'];

  // SMTP Configuration (recommended for production)
  // Uncomment and fill in your SMTP details below:
  /*
  $contact->smtp = array(
    'host' => 'smtp.gmail.com',
    'username' => 'kalibest10@gmail.com',
    'password' => 'your-app-password',
    'port' => '587'
  );
  */

  $contact->add_message( $_POST['name'], 'From');
  $contact->add_message( $_POST['email'], 'Email');
  $contact->add_message( $_POST['message'], 'Message', 10);

  echo $contact->send();
?>
