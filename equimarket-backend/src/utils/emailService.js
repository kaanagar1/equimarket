const nodemailer = require('nodemailer');

// Email transporter oluştur
const createTransporter = () => {
    // Production'da gerçek SMTP kullan
    if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Development'ta console'a yaz (email göndermeden)
    return {
        sendMail: async (options) => {
            console.log('📧 [DEV] Email gönderilecekti:');
            console.log('   To:', options.to);
            console.log('   Subject:', options.subject);
            console.log('   Text:', options.text?.substring(0, 100) + '...');
            return { messageId: 'dev-' + Date.now() };
        }
    };
};

const transporter = createTransporter();

// Email gönderme fonksiyonu
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'EquiMarket <noreply@equimarket.com>',
            to,
            subject,
            text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email gönderildi:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email gönderme hatası:', error);
        return { success: false, error: error.message };
    }
};

// Template'ler
const emailTemplates = {
    // Şifre sıfırlama
    passwordReset: (resetUrl, userName) => ({
        subject: 'EquiMarket - Şifre Sıfırlama',
        text: `Merhaba ${userName},\n\nŞifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n${resetUrl}\n\nBu link 1 saat geçerlidir.\n\nEğer bu isteği siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.\n\nEquiMarket Ekibi`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a3d2e; padding: 20px; text-align: center;">
                    <h1 style="color: #c9a55c; margin: 0;">EquiMarket</h1>
                </div>
                <div style="padding: 30px; background: #faf8f3;">
                    <h2 style="color: #2a2a2a;">Şifre Sıfırlama</h2>
                    <p>Merhaba ${userName},</p>
                    <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #c9a55c; color: #1a3d2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Şifremi Sıfırla</a>
                    </div>
                    <p style="color: #6b6b6b; font-size: 14px;">Bu link 1 saat geçerlidir.</p>
                    <p style="color: #6b6b6b; font-size: 14px;">Eğer bu isteği siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
                </div>
                <div style="background: #2a2a2a; padding: 15px; text-align: center;">
                    <p style="color: #6b6b6b; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} EquiMarket. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `
    }),

    // Hoş geldin emaili
    welcome: (userName) => ({
        subject: 'EquiMarket\'e Hoş Geldiniz!',
        text: `Merhaba ${userName},\n\nEquiMarket'e hoş geldiniz! Artık Türkiye'nin en prestijli at pazaryerinde alım-satım yapabilirsiniz.\n\nHesabınızla ilgili sorularınız için bize ulaşabilirsiniz.\n\nEquiMarket Ekibi`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a3d2e; padding: 20px; text-align: center;">
                    <h1 style="color: #c9a55c; margin: 0;">EquiMarket</h1>
                </div>
                <div style="padding: 30px; background: #faf8f3;">
                    <h2 style="color: #2a2a2a;">Hoş Geldiniz, ${userName}!</h2>
                    <p>EquiMarket ailesine katıldığınız için teşekkür ederiz.</p>
                    <p>Artık Türkiye'nin en prestijli at pazaryerinde:</p>
                    <ul>
                        <li>İlan verebilir</li>
                        <li>At satın alabilir</li>
                        <li>Satıcılarla iletişime geçebilirsiniz</li>
                    </ul>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/ilanlar.html" style="background: #c9a55c; color: #1a3d2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">İlanları Keşfet</a>
                    </div>
                </div>
                <div style="background: #2a2a2a; padding: 15px; text-align: center;">
                    <p style="color: #6b6b6b; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} EquiMarket. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `
    }),

    // Yeni mesaj bildirimi
    newMessage: (senderName, previewText, messageUrl) => ({
        subject: `Yeni Mesaj: ${senderName}`,
        text: `${senderName} size bir mesaj gönderdi:\n\n"${previewText}"\n\nMesajı görüntülemek için: ${messageUrl}\n\nEquiMarket`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a3d2e; padding: 20px; text-align: center;">
                    <h1 style="color: #c9a55c; margin: 0;">EquiMarket</h1>
                </div>
                <div style="padding: 30px; background: #faf8f3;">
                    <h2 style="color: #2a2a2a;">Yeni Mesajınız Var</h2>
                    <p><strong>${senderName}</strong> size bir mesaj gönderdi:</p>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #c9a55c; margin: 20px 0;">
                        <p style="margin: 0; color: #6b6b6b;">"${previewText}"</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${messageUrl}" style="background: #c9a55c; color: #1a3d2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Mesajı Görüntüle</a>
                    </div>
                </div>
                <div style="background: #2a2a2a; padding: 15px; text-align: center;">
                    <p style="color: #6b6b6b; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} EquiMarket. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `
    }),

    // Yeni teklif bildirimi
    newOffer: (senderName, horseName, offerAmount, messageUrl) => ({
        subject: `Yeni Teklif: ${horseName}`,
        text: `${senderName}, "${horseName}" ilanınız için ${offerAmount} TL teklif verdi.\n\nTeklifi değerlendirmek için: ${messageUrl}\n\nEquiMarket`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a3d2e; padding: 20px; text-align: center;">
                    <h1 style="color: #c9a55c; margin: 0;">EquiMarket</h1>
                </div>
                <div style="padding: 30px; background: #faf8f3;">
                    <h2 style="color: #2a2a2a;">Yeni Teklif Aldınız!</h2>
                    <p><strong>${senderName}</strong>, <strong>"${horseName}"</strong> ilanınız için teklif verdi:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="font-size: 32px; color: #1a3d2e; font-weight: bold; margin: 0;">₺${offerAmount.toLocaleString('tr-TR')}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${messageUrl}" style="background: #c9a55c; color: #1a3d2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Teklifi Değerlendir</a>
                    </div>
                </div>
                <div style="background: #2a2a2a; padding: 15px; text-align: center;">
                    <p style="color: #6b6b6b; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} EquiMarket. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `
    }),

    // İlan onaylandı
    listingApproved: (userName, horseName, listingUrl) => ({
        subject: `İlanınız Onaylandı: ${horseName}`,
        text: `Merhaba ${userName},\n\n"${horseName}" ilanınız onaylandı ve yayında!\n\nİlanınızı görüntüleyin: ${listingUrl}\n\nEquiMarket`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a3d2e; padding: 20px; text-align: center;">
                    <h1 style="color: #c9a55c; margin: 0;">EquiMarket</h1>
                </div>
                <div style="padding: 30px; background: #faf8f3;">
                    <h2 style="color: #4a7c59;">✓ İlanınız Onaylandı!</h2>
                    <p>Merhaba ${userName},</p>
                    <p><strong>"${horseName}"</strong> ilanınız onaylandı ve artık yayında!</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${listingUrl}" style="background: #c9a55c; color: #1a3d2e; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">İlanı Görüntüle</a>
                    </div>
                </div>
                <div style="background: #2a2a2a; padding: 15px; text-align: center;">
                    <p style="color: #6b6b6b; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} EquiMarket. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `
    }),

    // İlan reddedildi
    listingRejected: (userName, horseName, reason) => ({
        subject: `İlanınız Reddedildi: ${horseName}`,
        text: `Merhaba ${userName},\n\n"${horseName}" ilanınız maalesef reddedildi.\n\nRed nedeni: ${reason}\n\nİlanınızı düzenleyerek tekrar gönderebilirsiniz.\n\nEquiMarket`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #1a3d2e; padding: 20px; text-align: center;">
                    <h1 style="color: #c9a55c; margin: 0;">EquiMarket</h1>
                </div>
                <div style="padding: 30px; background: #faf8f3;">
                    <h2 style="color: #dc2626;">İlanınız Reddedildi</h2>
                    <p>Merhaba ${userName},</p>
                    <p><strong>"${horseName}"</strong> ilanınız maalesef reddedildi.</p>
                    <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Red nedeni:</strong> ${reason}</p>
                    </div>
                    <p>İlanınızı düzenleyerek tekrar gönderebilirsiniz.</p>
                </div>
                <div style="background: #2a2a2a; padding: 15px; text-align: center;">
                    <p style="color: #6b6b6b; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} EquiMarket. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `
    })
};

// Template ile email gönder
const sendTemplateEmail = async (to, templateName, data) => {
    const template = emailTemplates[templateName];
    if (!template) {
        console.error('Email template bulunamadı:', templateName);
        return { success: false, error: 'Template not found' };
    }

    const { subject, text, html } = template(...Object.values(data));
    return sendEmail({ to, subject, text, html });
};

module.exports = {
    sendEmail,
    sendTemplateEmail,
    emailTemplates
};
