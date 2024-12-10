from blinker import signal
from flask import current_app

from models import OpsEvent


class MessageBus:

    def subscribe(self, topic: str, callback: callable):
        ops_signal = signal(topic)
        ops_signal.connect(callback)

    def publish(self, topic: str, event: OpsEvent):
        ops_signal = signal(topic)
        ops_signal.send(event, session=current_app.db_session)

    def unsubscribe(self, topic, callback):
        ops_signal = signal(topic)
        ops_signal.disconnect(callback)

    def get_subscribers(self, topic) -> dict:
        ops_signal = signal(topic)
        return ops_signal.receivers
