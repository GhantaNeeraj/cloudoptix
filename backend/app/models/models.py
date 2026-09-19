from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id = Column(String, primary_key=True, index=True)  # e.g., "EC2-101"
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # Compute, Storage, Database, Networking
    provider = Column(String, nullable=False)  # AWS, Azure, GCP, Demo
    region = Column(String, nullable=False)
    status = Column(String, nullable=False)  # active, stopped, terminated
    monthly_cost = Column(Float, nullable=False)
    launch_time = Column(DateTime, default=datetime.utcnow)
    efficiency_score = Column(Float, default=100.0)
    is_idle = Column(Boolean, default=False)
    is_underutilized = Column(Boolean, default=False)
    
    # Relationships
    metrics = relationship("ResourceMetrics", back_populates="resource", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="resource", cascade="all, delete-orphan")
    billing_records = relationship("BillingRecord", back_populates="resource")

class ResourceMetrics(Base):
    __tablename__ = "resource_metrics"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, ForeignKey("cloud_resources.id", ondelete="CASCADE"), nullable=False)
    cpu_avg = Column(Float, default=0.0)
    cpu_max = Column(Float, default=0.0)
    mem_avg = Column(Float, default=0.0)
    mem_max = Column(Float, default=0.0)
    network_in_out_gb = Column(Float, default=0.0)
    disk_iops = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resource = relationship("CloudResource", back_populates="metrics")

class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)  # Compute, Storage, Database, Networking, etc.
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    resource_id = Column(String, ForeignKey("cloud_resources.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    resource = relationship("CloudResource", back_populates="billing_records")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, ForeignKey("cloud_resources.id", ondelete="CASCADE"), nullable=False)
    problem = Column(String, nullable=False)
    evidence = Column(Text, nullable=False)
    financial_impact = Column(Float, nullable=False)  # Monthly cost before optimization
    action = Column(String, nullable=False)  # Stop, Resize, Change Tier, etc.
    potential_savings = Column(Float, nullable=False)  # Monthly savings
    priority = Column(String, nullable=False)  # HIGH, MEDIUM, LOW
    status = Column(String, default="active")  # active, approved, dismissed

    # Relationships
    resource = relationship("CloudResource", back_populates="recommendations")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)  # Idle, High-Cost, Service-Increase, Spike, Budget, Forecast, Storage
    severity = Column(String, nullable=False)  # CRITICAL, WARNING, INFO
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    amount_involved = Column(Float, nullable=True)
    recommended_action = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
