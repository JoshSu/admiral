/*
 * Copyright (c) 2017-2020 VMware, Inc. All Rights Reserved.
 *
 * This product is licensed to you under the Apache License, Version 2.0 (the "License").
 * You may not use this product except in compliance with the License.
 *
 * This product may include a number of subcomponents with separate copyright notices
 * and license terms. Your use of these subcomponents is subject to the terms and
 * conditions of the subcomponent's license, as noted in the LICENSE file.
 */

package com.vmware.admiral.test.integration.client;

import java.util.List;
import java.util.Map;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlRootElement;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import com.vmware.admiral.test.integration.client.closures.ClosureInputsDeserializer;
import com.vmware.admiral.test.integration.client.closures.ClosureInputsSerializer;
import com.vmware.admiral.test.integration.client.dcp.DcpDocumentKind;

/**
 * Template spec (CompositeDescription or ContainerImageDescription)
 */
@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
@JsonIgnoreProperties(ignoreUnknown = true)
@DcpDocumentKind("com:vmware:admiral:compute:container:TemplateSpec")
public class TemplateSpec extends TenantedServiceDocument {

    // TODO: handle enum
    public String templateType;

    // container image fields

    public String description;

    public String registry;

    @XmlAttribute(name = "is_automated")
    @JsonProperty("is_automated")
    public boolean automated;

    @XmlAttribute(name = "is_trusted")
    @JsonProperty("is_trusted")
    public boolean trusted;

    @XmlAttribute(name = "is_official")
    @JsonProperty("is_official")
    public boolean official;

    @XmlAttribute(name = "star_count")
    @JsonProperty("star_count")
    public int starCount;

    // composite description fields
    public String name;

    public String status;

    public List<String> descriptionLinks;

    public Map<String, String> customProperties;

    // closure fields

    public String runtime;

    public String source;

    public String sourceURL;

    public String entrypoint;

    @JsonDeserialize(using = ClosureInputsDeserializer.class)
    @JsonSerialize(using = ClosureInputsSerializer.class)
    public Map<String, String> inputs;

    public String[] outputNames;

    // @JsonDeserialize(using = ClosureLogConfigDeserializer.class)
    // @JsonSerialize(using = ClosureLogConfigSerializer.class)
    // public String logConfiguration;
    public LogConfig logConfig;

    public ResourceConstraints resources;

    public String dependencies;

    public String placementLink;

    public String notifyUrl;
}
