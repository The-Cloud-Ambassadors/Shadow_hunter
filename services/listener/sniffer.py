import asyncio
import time
from scapy.all import IP, TCP, UDP
from scapy.packet import Packet
from loguru import logger
from pkg.models.events import NetworkFlowEvent, Protocol

class PacketProcessor:
    def __init__(self, producer):
        self.producer = producer
        self.loop = asyncio.get_event_loop()

    def process_packet_callback(self, packet: Packet):
        """
        Callback executed by Scapy (in a separate thread usually).
        We must schedule the async send to Kafka in the main loop.
        """
        if not packet.haslayer(IP):
            return

        try:
            ip_layer = packet[IP]
            protocol = Protocol.TCP if packet.haslayer(TCP) else \
                       Protocol.UDP if packet.haslayer(UDP) else None

            if not protocol:
                return

            # Basic extraction
            src_ip = ip_layer.src
            dst_ip = ip_layer.dst
            
            if protocol == Protocol.TCP:
                src_port = packet[TCP].sport
                dst_port = packet[TCP].dport
                payload_len = len(packet[TCP].payload)
            else:
                src_port = packet[UDP].sport
                dst_port = packet[UDP].dport
                payload_len = len(packet[UDP].payload)

            event = NetworkFlowEvent(
                source_ip=src_ip,
                source_port=src_port,
                destination_ip=dst_ip,
                destination_port=dst_port,
                protocol=protocol,
                bytes_sent=payload_len, # Approximation for single packet
                bytes_received=0
            )

            # Schedule async send
            asyncio.run_coroutine_threadsafe(
                self.producer.publish(
                    os.getenv("SH_KAFKA_TOPIC", "sh.telemetry.traffic.v1"), 
                    event
                ), 
                self.loop
            )

        except Exception as e:
            logger.error(f"Error processing packet: {e}")
