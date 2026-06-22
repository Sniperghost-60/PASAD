<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public string $password
    ) {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe - AgriSuivi CEP')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre mot de passe a été réinitialisé par un administrateur.')
            ->line('')
            ->line('**Votre nouveau mot de passe :**')
            ->line('**' . $this->password . '**')
            ->line('')
            ->line('⚠️ **Important :** Pour des raisons de sécurité, veuillez modifier ce mot de passe dès votre prochaine connexion.')
            ->action('Se connecter maintenant', url('/'))
            ->line('Si vous n\'avez pas demandé cette réinitialisation, veuillez contacter immédiatement l\'administrateur système.')
            ->salutation('Cordialement, L\'équipe AgriSuivi CEP');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
