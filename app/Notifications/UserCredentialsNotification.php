<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserCredentialsNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public string $password,
        public string $roleName
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
            ->subject('Votre compte AgriSuivi CEP a été créé')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Un compte a été créé pour vous sur la plateforme **AgriSuivi CEP**.')
            ->line('Vous avez été assigné au rôle : **' . $this->roleName . '**')
            ->line('')
            ->line('**Vos identifiants de connexion :**')
            ->line('**Email :** ' . $notifiable->email)
            ->line('**Mot de passe :** ' . $this->password)
            ->line('')
            ->line('⚠️ Pour des raisons de sécurité, veuillez modifier votre mot de passe lors de votre première connexion.')
            ->action('Se connecter', url('/'))
            ->line('Si vous n\'avez pas demandé la création de ce compte, veuillez contacter l\'administrateur système.');
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
