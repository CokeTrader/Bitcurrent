// BitCurrent Matching Engine - gRPC Server
// Accepts order submissions from API gateway

use crate::grpc::proto::matching_engine_server::{MatchingEngine as MatchingEngineService, MatchingEngineServer as Server};
use crate::grpc::proto::{CancelOrderRequest, CancelOrderResponse, GetOrderBookRequest, GetOrderBookResponse, OrderRequest, OrderResponse, PriceLevel as ProtoPriceLevel};
use crate::orderbook::OrderBookManager;
use crate::types::{MatchResult, Order, OrderType, Side, TimeInForce};
use anyhow::Result;
use rust_decimal::Decimal;
use std::str::FromStr;
use tonic::{transport::Server as TonicServer, Request, Response, Status};
use tracing::{error, info};
use uuid::Uuid;

pub struct MatchingEngineServer {
    orderbook_manager: OrderBookManager,
}

impl MatchingEngineServer {
    pub fn new(orderbook_manager: OrderBookManager) -> Self {
        Self { orderbook_manager }
    }

    pub async fn serve(self, addr: String) -> Result<()> {
        let addr = addr.parse()?;
        let service = Server::new(self);

        info!("Starting gRPC server on {}", addr);

        TonicServer::builder()
            .add_service(service)
            .serve(addr)
            .await?;

        Ok(())
    }
}

#[tonic::async_trait]
impl MatchingEngineService for MatchingEngineServer {
    async fn submit_order(
        &self,
        request: Request<OrderRequest>,
    ) -> Result<Response<OrderResponse>, Status> {
        let req = request.into_inner();
        
        // Parse order from request
        let order = parse_order_request(&req).map_err(|e| {
            error!("Failed to parse order: {}", e);
            Status::invalid_argument(format!("Invalid order: {}", e))
        })?;

        // Submit to orderbook
        let result = self
            .orderbook_manager
            .submit_order(order)
            .await
            .map_err(|e| {
                error!("Failed to submit order: {}", e);
                Status::internal(format!("Matching failed: {}", e))
            })?;

        // Build response
        let response = build_order_response(result);
        Ok(Response::new(response))
    }

    async fn cancel_order(
        &self,
        request: Request<CancelOrderRequest>,
    ) -> Result<Response<CancelOrderResponse>, Status> {
        let req = request.into_inner();
        
        let order_id = Uuid::from_str(&req.order_id).map_err(|e| {
            Status::invalid_argument(format!("Invalid order ID: {}", e))
        })?;

        let cancelled = self
            .orderbook_manager
            .cancel_order(&req.symbol, order_id)
            .await
            .map_err(|e| Status::internal(format!("Cancel failed: {}", e)))?;

        Ok(Response::new(CancelOrderResponse {
            success: cancelled.is_some(),
            message: if cancelled.is_some() {
                "Order cancelled successfully".to_string()
            } else {
                "Order not found".to_string()
            },
        }))
    }

    async fn get_order_book(
        &self,
        request: Request<GetOrderBookRequest>,
    ) -> Result<Response<GetOrderBookResponse>, Status> {
        let req = request.into_inner();
        let depth = req.depth as usize;

        let orderbook = self
            .orderbook_manager
            .get_depth(&req.symbol, depth)
            .await;

        match orderbook {
            Some((bids, asks)) => {
                let bid_levels: Vec<ProtoPriceLevel> = bids
                    .into_iter()
                    .map(|(price, qty)| ProtoPriceLevel {
                        price: price.to_string(),
                        quantity: qty.to_string(),
                    })
                    .collect();

                let ask_levels: Vec<ProtoPriceLevel> = asks
                    .into_iter()
                    .map(|(price, qty)| ProtoPriceLevel {
                        price: price.to_string(),
                        quantity: qty.to_string(),
                    })
                    .collect();

                Ok(Response::new(GetOrderBookResponse {
                    symbol: req.symbol,
                    bids: bid_levels,
                    asks: ask_levels,
                }))
            }
            None => Err(Status::not_found("Orderbook not found")),
        }
    }
}

fn parse_order_request(req: &OrderRequest) -> Result<Order> {
    let account_id = Uuid::from_str(&req.account_id)?;
    let side = match req.side.to_lowercase().as_str() {
        "buy" => Side::Buy,
        "sell" => Side::Sell,
        _ => anyhow::bail!("Invalid side"),
    };

    let order_type = match req.order_type.to_lowercase().as_str() {
        "market" => OrderType::Market,
        "limit" => OrderType::Limit,
        "stop" => OrderType::Stop,
        "stop_limit" => OrderType::StopLimit,
        _ => anyhow::bail!("Invalid order type"),
    };

    let price = if let Some(p) = &req.price {
        Some(Decimal::from_str(p)?)
    } else {
        None
    };

    let quantity = Decimal::from_str(&req.quantity)?;

    let time_in_force = match req.time_in_force.to_uppercase().as_str() {
        "GTC" => TimeInForce::GTC,
        "IOC" => TimeInForce::IOC,
        "FOK" => TimeInForce::FOK,
        "GTD" => TimeInForce::GTD,
        _ => TimeInForce::GTC,
    };

    Ok(Order::new(
        account_id,
        req.symbol.clone(),
        side,
        order_type,
        price,
        quantity,
        time_in_force,
        req.post_only,
        req.client_order_id.clone(),
        0, // Will be set by orderbook
    ))
}

fn build_order_response(result: MatchResult) -> OrderResponse {
    match result {
        MatchResult::Filled(trades) => OrderResponse {
            success: true,
            status: "filled".to_string(),
            message: format!("{} trades executed", trades.len()),
            trades_count: trades.len() as u32,
        },
        MatchResult::PartiallyFilled(trades, _) => OrderResponse {
            success: true,
            status: "partial".to_string(),
            message: format!("{} trades executed, order partially filled", trades.len()),
            trades_count: trades.len() as u32,
        },
        MatchResult::Added(_) => OrderResponse {
            success: true,
            status: "new".to_string(),
            message: "Order added to orderbook".to_string(),
            trades_count: 0,
        },
        MatchResult::Rejected(reason) => OrderResponse {
            success: false,
            status: "rejected".to_string(),
            message: reason,
            trades_count: 0,
        },
    }
}



